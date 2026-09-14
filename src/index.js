const { glob } = require('glob');
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const { preprocess, traverse, src } = require('@glimmer/syntax');

async function findComponentTree(packageName) {
  const cwd = process.cwd();
  const addonPath = path.join(cwd, 'node_modules', packageName, 'addon');

  if (!fs.existsSync(addonPath)) {
    throw new Error(`Package "${packageName}" not found or has no addon directory`);
  }

  const searchDirs = [
    path.join(cwd, 'app', 'components'),
    path.join(cwd, 'app', 'templates'),
    path.join(cwd, 'addon', 'components'),
    path.join(cwd, 'addon', 'templates'),
  ].filter((dir) => fs.existsSync(dir));

  const repoFiles = [];
  for (const dir of searchDirs) {
    const files = await glob('**/*.{gjs,gts}', { cwd: dir, absolute: true });
    for (const file of files) {
      repoFiles.push({
        absPath: file,
        relPath: path.relative(cwd, file),
      });
    }
  }

  const tree = [];
  const uniquePaths = new Set();
  const inPath = new Set();

  async function resolveComponent(importPath) {
    if (inPath.has(importPath)) {
      return { name: importPath, children: [], circular: true };
    }
    inPath.add(importPath);
    uniquePaths.add(importPath);

    const componentFile = await findComponentFile(addonPath, importPath, packageName);
    const children = [];

    try {
      if (componentFile) {
        const content = fs.readFileSync(componentFile, 'utf-8');
        const templateContent = await extractTemplateContent(componentFile, content);

        if (templateContent) {
          const localImports = extractPackageImports(content, packageName).reduce(
            (acc, imp) => {
              acc[imp.localName] = imp.importPath;
              return acc;
            },
            {},
          );
          const templateDeps = extractTemplateDependencies(
            templateContent,
            packageName,
            localImports,
            addonPath,
          );
          for (const dep of templateDeps) {
            const child = await resolveComponent(dep.path);
            children.push(child);
          }
        }
      }
    } finally {
      inPath.delete(importPath);
    }

    return { name: importPath, children };
  }

  for (const file of repoFiles) {
    const content = fs.readFileSync(file.absPath, 'utf-8');
    const imports = extractPackageImports(content, packageName);
    if (imports.length === 0) {
      continue;
    }
    const children = [];
    const seen = new Set();
    for (const imp of imports) {
      if (seen.has(imp.importPath)) continue;
      seen.add(imp.importPath);
      children.push(await resolveComponent(imp.importPath));
    }
    tree.push({ name: file.relPath, children });
  }

  return { tree, list: Array.from(uniquePaths).sort() };
}

function extractPackageImports(content, packageName) {
  const ast = parseSource(content);
  if (!ast) return [];
  const prefix = `${packageName}/components/`;
  const imports = [];

  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    if (node.importKind === 'type') continue;
    if (!node.source.value.startsWith(prefix)) continue;

    for (const spec of node.specifiers) {
      if (spec.importKind === 'type') continue;
      imports.push({ localName: spec.local.name, importPath: node.source.value });
    }
  }

  return imports;
}

function parseSource(content) {
  const options = { sourceType: 'module', plugins: ['typescript', 'decorators-legacy'] };
  try {
    return parse(content, options);
  } catch {
    try {
      return parse(stripTemplateBlocks(content), options);
    } catch {
      return null;
    }
  }
}

function stripTemplateBlocks(content) {
  let ast;
  try {
    ast = preprocess(content, { mode: 'codemod' });
  } catch {
    return content;
  }

  const source = src.Source.from(content);
  const ranges = [];

  traverse(ast, {
    ElementNode(node) {
      if (node.tag !== 'template') return;
      const start = source.charPosFor(node.loc.start);
      const end = source.charPosFor(node.loc.end);
      ranges.push([start, end]);
    },
  });

  if (ranges.length === 0) return content;
  ranges.sort((a, b) => a[0] - b[0]);

  let stripped = '';
  let cursor = 0;
  for (const [start, end] of ranges) {
    stripped += content.slice(cursor, start);
    cursor = end;
  }
  stripped += content.slice(cursor);
  return stripped;
}

async function findComponentFile(addonPath, importPath, packageName) {
  const prefix = `${packageName}/components/`;
  const relativePath = importPath.startsWith(prefix)
    ? importPath.slice(prefix.length)
    : importPath;

  const gjsGlob = path.join(addonPath, 'components', `${relativePath}.{gjs,gts}`);
  const gjsFiles = await glob(gjsGlob);
  if (gjsFiles.length > 0) {
    return gjsFiles[0];
  }

  const jsGlob = path.join(addonPath, 'components', `${relativePath}.{js,ts}`);
  const jsFiles = await glob(jsGlob);
  if (jsFiles.length > 0) {
    const jsFile = jsFiles[0];
    const hbsFile = jsFile.replace(/\.(js|ts)$/, '.hbs');
    if (fs.existsSync(hbsFile)) {
      return hbsFile;
    }

    const templateGlob = path.join(
      addonPath,
      'templates',
      'components',
      `${relativePath}.hbs`,
    );
    const templateFiles = await glob(templateGlob);
    if (templateFiles.length > 0) {
      return templateFiles[0];
    }

    return jsFile;
  }

  const directHbs = path.join(addonPath, 'components', `${relativePath}.hbs`);
  if (fs.existsSync(directHbs)) {
    return directHbs;
  }

  return null;
}

async function extractTemplateContent(filePath, content) {
  if (filePath.endsWith('.hbs')) {
    return content;
  }

  if (filePath.endsWith('.gjs') || filePath.endsWith('.gts')) {
    const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/);
    if (templateMatch) {
      return templateMatch[1];
    }
  }

  return null;
}

function extractTemplateDependencies(
  templateContent,
  packageName,
  localImports = {},
  addonPath = null,
) {
  const dependencies = [];
  const seen = new Set();

  function addDependency(path) {
    if (seen.has(path)) return;
    seen.add(path);
    dependencies.push({ path });
  }

  try {
    const ast = preprocess(templateContent);

    traverse(ast, {
      ElementNode(node) {
        if (!isComponentTag(node.tag)) return;
        const resolvedPath = resolveTagToPath(
          node.tag,
          packageName,
          localImports,
          addonPath,
        );
        if (resolvedPath) {
          addDependency(resolvedPath);
        }
      },

      MustacheStatement(node) {
        if (node.path.type === 'PathExpression') {
          const resolvedPath = resolveNameToPath(
            node.path.original,
            packageName,
            localImports,
            addonPath,
          );
          if (resolvedPath) {
            addDependency(resolvedPath);
          }
        }
      },

      BlockStatement(node) {
        if (node.path.type === 'PathExpression') {
          const resolvedPath = resolveNameToPath(
            node.path.original,
            packageName,
            localImports,
            addonPath,
          );
          if (resolvedPath) {
            addDependency(resolvedPath);
          }
        }
      },
    });
  } catch (e) {
    console.warn('Warning: Could not parse template:', e.message);
  }

  return dependencies;
}

function isComponentTag(tag) {
  return /^[A-Z]/.test(tag) || tag.includes('-');
}

function resolveNameToPath(name, packageName, localImports = {}, addonPath = null) {
  if (name.startsWith(`${packageName}/components/`)) {
    return name;
  }
  if (name.startsWith('@') || name.startsWith('this.') || name.includes('.')) {
    return null;
  }
  if (localImports[name]) {
    return localImports[name];
  }
  return resolveInPackage(name, packageName, addonPath);
}

function resolveTagToPath(tag, packageName, localImports = {}, addonPath = null) {
  if (tag.startsWith(`${packageName}/components/`)) {
    return tag;
  }
  if (localImports[tag]) {
    return localImports[tag];
  }
  return resolveInPackage(tag, packageName, addonPath);
}

function resolveInPackage(name, packageName, addonPath) {
  if (!addonPath) {
    return null;
  }
  const relPath = toComponentPath(name);
  if (componentFileExists(addonPath, relPath)) {
    return `${packageName}/components/${relPath}`;
  }
  return null;
}

function toComponentPath(name) {
  return name
    .split('::')
    .map((segment) =>
      segment
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[ _]/g, '-')
        .toLowerCase(),
    )
    .join('/');
}

function componentFileExists(addonPath, relPath) {
  const exts = ['.gjs', '.gts', '.js', '.ts', '.hbs'];
  for (const ext of exts) {
    if (fs.existsSync(path.join(addonPath, 'components', relPath + ext))) {
      return true;
    }
  }
  return fs.existsSync(path.join(addonPath, 'templates', 'components', relPath + '.hbs'));
}

module.exports = {
  findComponentTree,
  extractPackageImports,
  findComponentFile,
  extractTemplateContent,
  extractTemplateDependencies,
  resolveNameToPath,
  resolveTagToPath,
  resolveInPackage,
  toComponentPath,
  componentFileExists,
  isComponentTag,
};

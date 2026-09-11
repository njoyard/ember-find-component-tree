import { describe, it, expect, afterEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findComponentTree } from '../src/index.js';

const fixturesDir = fileURLToPath(new URL('./fixtures', import.meta.url));
const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

async function inFixture(name, fn) {
  process.chdir(path.join(fixturesDir, name));
  try {
    return await fn();
  } finally {
    process.chdir(originalCwd);
  }
}

describe('findComponentTree', () => {
  it('outputs a tree anchored at repository component files', async () => {
    await inFixture('basic', async () => {
      const result = await findComponentTree('my-components');

      expect(result.tree).toHaveLength(1);
      const root = result.tree[0];
      expect(root.name).toBe('app/components/my-component.gjs');

      const button = root.children[0];
      expect(button.name).toBe('my-components/components/button');
      expect(button.children).toHaveLength(1);
      expect(button.children[0].name).toBe('my-components/components/icon');
      expect(button.children[0].children).toHaveLength(0);
    });
  });

  it('resolves .js component via sibling .hbs', async () => {
    await inFixture('js-sibling-hbs', async () => {
      const result = await findComponentTree('my-components');

      const root = result.tree[0];
      expect(root.name).toBe('app/components/my-component.gjs');
      const card = root.children[0];
      expect(card.name).toBe('my-components/components/card');
      expect(card.children).toHaveLength(1);
      expect(card.children[0].name).toBe('my-components/components/icon');
    });
  });

  it('resolves .js component via addon/templates/components', async () => {
    await inFixture('js-template-components', async () => {
      const result = await findComponentTree('my-components');

      const root = result.tree[0];
      const badge = root.children[0];
      expect(badge.name).toBe('my-components/components/badge');
      expect(badge.children[0].name).toBe('my-components/components/icon');
    });
  });

  it('scans gts files and app/templates', async () => {
    await inFixture('gts-app-templates', async () => {
      const result = await findComponentTree('my-components');

      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].name).toBe('app/templates/index.gts');
      expect(result.list).toEqual(['my-components/components/icon']);
    });
  });

  it('lists unique component paths', async () => {
    await inFixture('list', async () => {
      const result = await findComponentTree('my-components');

      expect(result.tree.map((root) => root.name).sort()).toEqual([
        'app/components/a.gjs',
        'app/components/b.gjs',
        'app/components/c.gjs',
      ]);
      expect(result.list).toEqual([
        'my-components/components/badge',
        'my-components/components/button',
        'my-components/components/card',
        'my-components/components/icon',
      ]);
    });
  });

  it('detects circular dependencies', async () => {
    await inFixture('circular', async () => {
      const result = await findComponentTree('my-components');

      const root = result.tree[0];
      const alpha = root.children[0];
      expect(alpha.name).toBe('my-components/components/alpha');
      expect(alpha.children[0].name).toBe('my-components/components/beta');
      expect(alpha.children[0].children[0].name).toBe('my-components/components/alpha');
      expect(alpha.children[0].children[0].circular).toBe(true);
    });
  });

  it('throws when package is not installed', async () => {
    await inFixture('missing-package', async () => {
      await expect(findComponentTree('nonexistent-package')).rejects.toThrow(
        /not found or has no addon directory/,
      );
    });
  });

  it('works with scoped packages whose name contains /components/', async () => {
    await inFixture('scoped', async () => {
      const result = await findComponentTree('@nl-rvo/components');

      expect(result.list).toEqual([
        '@nl-rvo/components/components/button',
        '@nl-rvo/components/components/icon',
      ]);
    });
  });

  it('resolves nested component paths', async () => {
    await inFixture('nested', async () => {
      const result = await findComponentTree('my-components');

      const root = result.tree[0];
      const field = root.children[0];
      expect(field.name).toBe('my-components/components/form/field');
      expect(field.children).toHaveLength(1);
      expect(field.children[0].name).toBe('my-components/components/form/input');
    });
  });

  it('handles named, aliased, and mixed imports', async () => {
    await inFixture('named-imports', async () => {
      const result = await findComponentTree('my-components');

      expect(result.tree.map((root) => root.name).sort()).toEqual([
        'app/components/a.gjs',
        'app/components/b.gjs',
        'app/components/c.gjs',
      ]);

      const roots = {};
      for (const root of result.tree) {
        roots[root.name] = root;
      }
      const aDeps = roots['app/components/a.gjs'].children.map((c) => c.name);
      expect(aDeps).toEqual(['my-components/components/icon']);
      const bDeps = roots['app/components/b.gjs'].children.map((c) => c.name);
      expect(bDeps).toEqual(['my-components/components/icon']);
      const cDeps = roots['app/components/c.gjs'].children.map((c) => c.name);
      expect(cDeps).toEqual(['my-components/components/button']);

      const button = roots['app/components/c.gjs'].children.find(
        (c) => c.name === 'my-components/components/button',
      );
      expect(button.children.map((c) => c.name)).toEqual([
        'my-components/components/icon',
      ]);
    });
  });

  it('resolves classic .hbs component references', async () => {
    await inFixture('classic-hbs', async () => {
      const result = await findComponentTree('my-components');

      const root = result.tree[0];
      const card = root.children[0];
      expect(card.name).toBe('my-components/components/card');
      expect(card.children.map((c) => c.name).sort()).toEqual([
        'my-components/components/form/field',
        'my-components/components/icon',
      ]);

      const field = card.children.find(
        (c) => c.name === 'my-components/components/form/field',
      );
      expect(field.children).toHaveLength(0);
    });
  });

  it('walks deep dependency chains', async () => {
    await inFixture('chain', async () => {
      const result = await findComponentTree('my-components');

      const a = result.tree[0].children[0];
      const b = a.children[0];
      const c = b.children[0];
      const d = c.children[0];
      expect(a.name).toBe('my-components/components/a');
      expect(b.name).toBe('my-components/components/b');
      expect(c.name).toBe('my-components/components/c');
      expect(d.name).toBe('my-components/components/d');
      expect(result.list).toEqual([
        'my-components/components/a',
        'my-components/components/b',
        'my-components/components/c',
        'my-components/components/d',
      ]);
    });
  });
});

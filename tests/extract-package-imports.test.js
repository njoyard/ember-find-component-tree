import { describe, it, expect } from 'vitest';
import { extractPackageImports } from '../src/index.js';
import { PKG } from './test-helpers.js';

describe('extractPackageImports', () => {
  it('ignores imports from other packages', () => {
    const content = "import Component from '@glimmer/component';";
    expect(extractPackageImports(content, PKG)).toEqual([]);
  });

  it('extracts default imports', () => {
    const content = "import Button from 'my-components/components/button';";
    expect(extractPackageImports(content, PKG)).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
    ]);
  });

  it('extracts named imports', () => {
    const content = "import { Icon } from 'my-components/components/icon';";
    expect(extractPackageImports(content, PKG)).toEqual([
      { localName: 'Icon', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts aliased named imports', () => {
    const content = "import { Icon as Glyph } from 'my-components/components/icon';";
    expect(extractPackageImports(content, PKG)).toEqual([
      { localName: 'Glyph', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts mixed default + named imports', () => {
    const content = "import Button, { Icon } from 'my-components/components/button';";
    expect(extractPackageImports(content, PKG)).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
      { localName: 'Icon', importPath: 'my-components/components/button' },
    ]);
  });

  it('extracts multiple imports from different source lines', () => {
    const content = `import Button from 'my-components/components/button';
import { Icon } from 'my-components/components/icon';`;
    expect(extractPackageImports(content, PKG)).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
      { localName: 'Icon', importPath: 'my-components/components/icon' },
    ]);
  });

  it('rejects imports pointing at other pieces of the same package', () => {
    const content = "import helpers from 'my-components/helpers/format';";
    expect(extractPackageImports(content, PKG)).toEqual([]);
  });
});

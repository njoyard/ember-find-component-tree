import { describe, it, expect } from 'vitest';
import { extractPackageImports } from '../src/index.js';

describe('extractPackageImports', () => {
  it('ignores imports from other packages', () => {
    const content = "import Component from '@glimmer/component';";
    expect(extractPackageImports(content, 'my-components')).toEqual([]);
  });

  it('extracts default imports', () => {
    const content = "import Button from 'my-components/components/button';";
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
    ]);
  });

  it('extracts named imports', () => {
    const content = "import { Icon } from 'my-components/components/icon';";
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Icon', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts aliased named imports', () => {
    const content = "import { Icon as Glyph } from 'my-components/components/icon';";
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Glyph', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts mixed default + named imports', () => {
    const content = "import Button, { Icon } from 'my-components/components/button';";
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
      { localName: 'Icon', importPath: 'my-components/components/button' },
    ]);
  });

  it('extracts multiple imports from different source lines', () => {
    const content = `import Button from 'my-components/components/button';
import { Icon } from 'my-components/components/icon';`;
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Button', importPath: 'my-components/components/button' },
      { localName: 'Icon', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts multiline named imports', () => {
    const content = `import {
  Icon,
  Badge,
} from 'my-components/components/icon';`;
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'Icon', importPath: 'my-components/components/icon' },
      { localName: 'Badge', importPath: 'my-components/components/icon' },
    ]);
  });

  it('extracts multiline named imports from a scoped package', () => {
    const content = `import {
  foo,
  bar as baz,
} from '@module/components/x';`;
    expect(extractPackageImports(content, '@module')).toEqual([
      { localName: 'foo', importPath: '@module/components/x' },
      { localName: 'baz', importPath: '@module/components/x' },
    ]);
  });

  it('rejects imports pointing at other pieces of the same package', () => {
    const content = "import helpers from 'my-components/helpers/format';";
    expect(extractPackageImports(content, 'my-components')).toEqual([]);
  });

  it('extracts imports from a .gjs file using legacy decorators', () => {
    const content = `import Component from '@ember/component';
import ModalDialog from 'my-components/components/modal-dialog';
import { action } from '@ember/object';

export default class RejectModal extends Component {
  @action
  handleConfirmButtonClick() {}

  <template>
    <ModalDialog @title="Decline Opportunity" />
  </template>
}`;
    expect(extractPackageImports(content, 'my-components')).toEqual([
      { localName: 'ModalDialog', importPath: 'my-components/components/modal-dialog' },
    ]);
  });
});

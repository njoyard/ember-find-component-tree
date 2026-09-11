import { describe, it, expect } from 'vitest';
import { resolveNameToPath } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('resolveNameToPath', () => {
  const fixture = setupTmpDir();

  it('returns the full path when it already has the package prefix', () => {
    expect(resolveNameToPath('my-components/components/icon', 'my-components')).toBe(
      'my-components/components/icon',
    );
  });

  it('skips @ and this. prefixed names', () => {
    expect(resolveNameToPath('@label', 'my-components')).toBeNull();
    expect(resolveNameToPath('this.items', 'my-components')).toBeNull();
  });

  it('skips names containing a dot', () => {
    expect(resolveNameToPath('foo.bar', 'my-components')).toBeNull();
  });

  it('resolves via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    expect(resolveNameToPath('Icon', 'my-components', localImports)).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a classic name when the file exists in the package', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(resolveNameToPath('Icon', 'my-components', {}, fixture.addonPath())).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a namespaced classic tag', () => {
    fixture.writeAddon('components/form/field.gjs');
    expect(
      resolveNameToPath('Form::Field', 'my-components', {}, fixture.addonPath()),
    ).toBe('my-components/components/form/field');
  });

  it('returns null when the file does not exist in the package', () => {
    expect(
      resolveNameToPath('Icon', 'my-components', {}, fixture.addonPath()),
    ).toBeNull();
  });
});

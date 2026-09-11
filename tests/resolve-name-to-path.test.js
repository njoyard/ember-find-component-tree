import { describe, it, expect } from 'vitest';
import { resolveNameToPath } from '../src/index.js';
import { PKG, setupTmpDir } from './test-helpers.js';

describe('resolveNameToPath', () => {
  const fixture = setupTmpDir();

  it('returns the full path when it already has the package prefix', () => {
    expect(resolveNameToPath('my-components/components/icon', PKG)).toBe(
      'my-components/components/icon',
    );
  });

  it('skips @ and this. prefixed names', () => {
    expect(resolveNameToPath('@label', PKG)).toBeNull();
    expect(resolveNameToPath('this.items', PKG)).toBeNull();
  });

  it('skips names containing a dot', () => {
    expect(resolveNameToPath('foo.bar', PKG)).toBeNull();
  });

  it('resolves via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    expect(resolveNameToPath('Icon', PKG, localImports)).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a classic name when the file exists in the package', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(resolveNameToPath('Icon', PKG, {}, fixture.addonPath())).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a namespaced classic tag', () => {
    fixture.writeAddon('components/form/field.gjs');
    expect(resolveNameToPath('Form::Field', PKG, {}, fixture.addonPath())).toBe(
      'my-components/components/form/field',
    );
  });

  it('returns null when the file does not exist in the package', () => {
    expect(resolveNameToPath('Icon', PKG, {}, fixture.addonPath())).toBeNull();
  });
});

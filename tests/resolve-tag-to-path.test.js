import { describe, it, expect } from 'vitest';
import { resolveTagToPath } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('resolveTagToPath', () => {
  const fixture = setupTmpDir();

  it('returns the full path when it already has the package prefix', () => {
    expect(resolveTagToPath('my-components/components/icon', 'my-components')).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    expect(resolveTagToPath('Icon', 'my-components', localImports)).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a classic tag when the file exists in the package', () => {
    fixture.writeAddon('components/icon.gjs');
    expect(resolveTagToPath('Icon', 'my-components', {}, fixture.addonPath())).toBe(
      'my-components/components/icon',
    );
  });

  it('resolves a namespaced tag', () => {
    fixture.writeAddon('components/form/field.js');
    expect(
      resolveTagToPath('Form::Field', 'my-components', {}, fixture.addonPath()),
    ).toBe('my-components/components/form/field');
  });

  it('returns null when the file does not exist', () => {
    expect(resolveTagToPath('Icon', 'my-components', {}, fixture.addonPath())).toBeNull();
  });
});

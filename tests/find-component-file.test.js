import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { findComponentFile } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('findComponentFile', () => {
  const fixture = setupTmpDir();
  const importPath = 'my-components/components/button';

  it('finds a .gjs file', async () => {
    fixture.writeAddon('components/button.gjs');
    expect(
      await findComponentFile(fixture.addonPath(), importPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/button.gjs'));
  });

  it('finds a .gts file', async () => {
    fixture.writeAddon('components/button.gts');
    expect(
      await findComponentFile(fixture.addonPath(), importPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/button.gts'));
  });

  it('finds a .js file with a sibling .hbs and returns the .hbs', async () => {
    fixture.writeAddon('components/button.js', 'export default class Button {}');
    fixture.writeAddon('components/button.hbs', '<button />');
    expect(
      await findComponentFile(fixture.addonPath(), importPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/button.hbs'));
  });

  it('finds a .js file without sibling .hbs but with templates/components', async () => {
    fixture.writeAddon('components/badge.js', 'export default class Badge {}');
    fixture.writeAddon('templates/components/badge.hbs', '<span />');
    const badgeImportPath = 'my-components/components/badge';
    expect(
      await findComponentFile(fixture.addonPath(), badgeImportPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'templates/components/badge.hbs'));
  });

  it('falls back to the .js file itself when no .hbs exists', async () => {
    fixture.writeAddon('components/badge.js', 'export default class Badge {}');
    const badgeImportPath = 'my-components/components/badge';
    expect(
      await findComponentFile(fixture.addonPath(), badgeImportPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/badge.js'));
  });

  it('finds a standalone .hbs file', async () => {
    fixture.writeAddon('components/legacy.hbs', '<div />');
    const legacyImportPath = 'my-components/components/legacy';
    expect(
      await findComponentFile(fixture.addonPath(), legacyImportPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/legacy.hbs'));
  });

  it('returns null when nothing is found', async () => {
    expect(
      await findComponentFile(fixture.addonPath(), importPath, 'my-components'),
    ).toBeNull();
  });

  it('resolves nested paths', async () => {
    fixture.writeAddon('components/form/field.gjs');
    const nestedImportPath = 'my-components/components/form/field';
    expect(
      await findComponentFile(fixture.addonPath(), nestedImportPath, 'my-components'),
    ).toBe(path.join(fixture.addonPath(), 'components/form/field.gjs'));
  });
});

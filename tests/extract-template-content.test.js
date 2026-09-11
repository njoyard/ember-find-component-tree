import { describe, it, expect } from 'vitest';
import { extractTemplateContent } from '../src/index.js';

describe('extractTemplateContent', () => {
  it('returns the full content for .hbs files', async () => {
    await expect(extractTemplateContent('foo.hbs', '<div>hi</div>')).resolves.toBe(
      '<div>hi</div>',
    );
  });

  it('extracts template block from .gjs files', async () => {
    const content = `
      const X = <template>
        <Icon />
      </template>
    `;
    await expect(extractTemplateContent('foo.gjs', content)).resolves.toBe(
      '\n        <Icon />\n      ',
    );
  });

  it('handles template with attributes', async () => {
    const content = `
      <template @foo="bar">
        <Icon />
      </template>
    `;
    await expect(extractTemplateContent('foo.gts', content)).resolves.toBe(
      '\n        <Icon />\n      ',
    );
  });

  it('returns null for .js files', async () => {
    await expect(
      extractTemplateContent('foo.js', 'export default {};'),
    ).resolves.toBeNull();
  });

  it('returns null for .ts files', async () => {
    await expect(
      extractTemplateContent('foo.ts', 'export default {};'),
    ).resolves.toBeNull();
  });

  it('returns null when no <template> block is present', async () => {
    await expect(
      extractTemplateContent('foo.gjs', 'import x from "y";'),
    ).resolves.toBeNull();
  });
});

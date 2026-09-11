import { describe, it, expect } from 'vitest';
import { extractTemplateDependencies } from '../src/index.js';
import { setupTmpDir } from './test-helpers.js';

describe('extractTemplateDependencies', () => {
  const fixture = setupTmpDir();

  it('resolves an ElementNode via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    const deps = extractTemplateDependencies('<Icon />', 'my-components', localImports);
    expect(deps).toEqual([{ path: 'my-components/components/icon' }]);
  });

  it('resolves a MustacheStatement via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    const deps = extractTemplateDependencies('{{Icon}}', 'my-components', localImports);
    expect(deps).toEqual([{ path: 'my-components/components/icon' }]);
  });

  it('resolves a BlockStatement via localImports', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    const deps = extractTemplateDependencies(
      '{{#Icon}}block{{/Icon}}',
      'my-components',
      localImports,
    );
    expect(deps).toEqual([{ path: 'my-components/components/icon' }]);
  });

  it('resolves a full package path in a MustacheStatement', () => {
    const deps = extractTemplateDependencies(
      '{{my-components/components/icon}}',
      'my-components',
    );
    expect(deps).toEqual([{ path: 'my-components/components/icon' }]);
  });

  it('resolves a namespaced classic tag when file exists', () => {
    fixture.writeAddon('components/form/field.gjs');
    const deps = extractTemplateDependencies(
      '<Form::Field />',
      'my-components',
      {},
      fixture.addonPath(),
    );
    expect(deps).toEqual([{ path: 'my-components/components/form/field' }]);
  });

  it('resolves a classic mustache reference when file exists', () => {
    fixture.writeAddon('components/icon.gjs');
    const deps = extractTemplateDependencies(
      '{{Icon}}',
      'my-components',
      {},
      fixture.addonPath(),
    );
    expect(deps).toEqual([{ path: 'my-components/components/icon' }]);
  });

  it('ignores HTML element tags', () => {
    const template = `
      <div>
        <span>hi</span>
      </div>
    `;
    const deps = extractTemplateDependencies(template, 'my-components');
    expect(deps).toEqual([]);
  });

  it('ignores @-prefixed path expressions', () => {
    const deps = extractTemplateDependencies('<div>{{@label}}</div>', 'my-components');
    expect(deps).toEqual([]);
  });

  it('deduplicates dependencies', () => {
    const localImports = { Icon: 'my-components/components/icon' };
    const deps = extractTemplateDependencies(
      '<Icon /><Icon />',
      'my-components',
      localImports,
    );
    expect(deps).toHaveLength(1);
  });
});

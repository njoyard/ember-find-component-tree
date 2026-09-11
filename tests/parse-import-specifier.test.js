import { describe, it, expect } from 'vitest';
import { parseImportSpecifier } from '../src/index.js';

describe('parseImportSpecifier', () => {
  it('parses a default import', () => {
    expect(parseImportSpecifier('Button')).toEqual(['Button']);
  });

  it('parses a named import', () => {
    expect(parseImportSpecifier('{ Icon }')).toEqual(['Icon']);
  });

  it('parses multiple named imports', () => {
    expect(parseImportSpecifier('{ Icon, Badge }')).toEqual(['Icon', 'Badge']);
  });

  it('parses an aliased named import', () => {
    expect(parseImportSpecifier('{ Icon as Glyph }')).toEqual(['Glyph']);
  });

  it('parses a default + named mixed import', () => {
    expect(parseImportSpecifier('Button, { Icon }')).toEqual(['Button', 'Icon']);
  });

  it('parses a namespace import', () => {
    expect(parseImportSpecifier('* as Components')).toEqual(['Components']);
  });

  it('handles extra whitespace', () => {
    expect(parseImportSpecifier('  Button  ,  {  Icon  as  Glyph  }  ')).toEqual([
      'Button',
      'Glyph',
    ]);
  });

  it('returns empty array for an empty specifier', () => {
    expect(parseImportSpecifier('')).toEqual([]);
  });
});

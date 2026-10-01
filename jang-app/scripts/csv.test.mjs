import { describe, expect, it } from 'vitest';
import { PRIVATE_COLUMNS, PUBLIC_COLUMNS, parseCsv } from './csv.mjs';

describe('parseCsv', () => {
  it('parses quoted fields with commas, escaped quotes and newlines', () => {
    const csv = 'A,B,C\r\n1,"x, y","say ""hi"""\r\n2,"line1\nline2",z\r\n';
    expect(parseCsv(csv)).toEqual([
      { A: '1', B: 'x, y', C: 'say "hi"' },
      { A: '2', B: 'line1\nline2', C: 'z' },
    ]);
  });

  it('handles a BOM, a missing final newline and empty trailing cells', () => {
    expect(parseCsv('﻿A,B\n1,')).toEqual([{ A: '1', B: '' }]);
  });

  it('returns an empty list for an empty file', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('column lists', () => {
  it('never mixes public and private columns', () => {
    expect(PUBLIC_COLUMNS.filter((c) => PRIVATE_COLUMNS.includes(c))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import { buildNotebookExport, exportFileName } from './notebook-export';
import type { Notebook } from './repository';

const NOW = new Date(2026, 9, 1, 9, 12);

// The reference-answer column names are not listed here: check:answers forbids them in src/.
// The exact-keys test above already rejects any extra field.
const FORBIDDEN_KEYS = ['statement', 'data', 'validation', 'updatedAt'];

describe('buildNotebookExport', () => {
  const notebook: Notebook = {
    'JNG-PC-03': { status: 'solved', note: 'Revoir pKa', updatedAt: '2026-09-30T10:00:00.000Z' },
  };
  const result = buildNotebookExport(notebook, NOW);

  it('lists every exercise in catalogue order with only id, chapter, status and note', () => {
    expect(result.exercises.map((entry) => entry.id)).toEqual(EXERCISES.map((exercise) => exercise.id));
    for (const entry of result.exercises) {
      expect(Object.keys(entry).sort()).toEqual(['chapter', 'id', 'note', 'status']);
    }
  });

  it('carries saved entries and defaults the others to todo with an empty note', () => {
    const saved = result.exercises.find((entry) => entry.id === 'JNG-PC-03');
    expect(saved).toMatchObject({ status: 'solved', note: 'Revoir pKa' });
    const untouched = result.exercises.find((entry) => entry.id === 'JNG-PC-01');
    expect(untouched).toMatchObject({ status: 'todo', note: '' });
  });

  it('records the export date', () => {
    expect(result.exportedAt).toBe(NOW.toISOString());
    expect(Object.keys(result).sort()).toEqual(['exercises', 'exportedAt']);
  });

  it('contains no statement, data or validation field', () => {
    const text = JSON.stringify(result);
    for (const key of FORBIDDEN_KEYS) expect(text).not.toContain(`"${key}"`);
    for (const exercise of EXERCISES) expect(text).not.toContain(exercise.statement);
  });
});

describe('exportFileName', () => {
  it('uses AAAA-MM-JJ with zero padding', () => {
    expect(exportFileName(new Date(2026, 9, 1))).toBe('jang-carnet-2026-10-01.json');
    expect(exportFileName(new Date(2027, 0, 5))).toBe('jang-carnet-2027-01-05.json');
  });
});

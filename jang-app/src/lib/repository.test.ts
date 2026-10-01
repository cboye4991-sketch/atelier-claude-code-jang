import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  createLocalStorageRepository,
  createMemoryRepository,
  sanitizeNotebook,
  type Notebook,
} from './repository';
import { summarize } from './use-notebook';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

function brokenStorage(): Storage {
  const fail = () => {
    throw new DOMException('blocked', 'SecurityError');
  };
  return {
    get length() {
      return fail();
    },
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

const sample: Notebook = {
  'JNG-PC-03': { status: 'solved', note: 'Penser au pKa', updatedAt: '2026-10-01T10:00:00.000Z' },
};

describe('localStorage repository', () => {
  it('saves and reloads entries, also from a new repository instance (page refresh)', async () => {
    const storage = fakeStorage();
    await createLocalStorageRepository(storage).save(sample);
    const reloaded = await createLocalStorageRepository(storage).load();
    expect(reloaded).toEqual(sample);
  });

  it('clears the notebook', async () => {
    const storage = fakeStorage();
    const repository = createLocalStorageRepository(storage);
    await repository.save(sample);
    await repository.clear();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(await repository.load()).toEqual({});
  });

  it('survives corrupted JSON', async () => {
    const repository = createLocalStorageRepository(fakeStorage({ [STORAGE_KEY]: '{not json' }));
    expect(await repository.load()).toEqual({});
  });

  it('drops unknown IDs, unknown statuses and truncates long notes', () => {
    const cleaned = sanitizeNotebook({
      'JNG-PC-01': { status: 'tried', note: 'x'.repeat(500), updatedAt: 'now' },
      'JNG-PC-99': { status: 'solved', note: '', updatedAt: '' },
      'JNG-PC-02': { status: 'hacked', note: '', updatedAt: '' },
      'JNG-PC-04': 'nope',
    });
    expect(Object.keys(cleaned)).toEqual(['JNG-PC-01']);
    expect(cleaned['JNG-PC-01']?.note).toHaveLength(280);
    expect(sanitizeNotebook(null)).toEqual({});
    expect(sanitizeNotebook([])).toEqual({});
  });

  it('keeps working in memory when a write fails (quota)', async () => {
    const storage = fakeStorage();
    storage.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    const repository = createLocalStorageRepository(storage);
    await repository.save(sample);
    expect(repository.isPersistent).toBe(false);
  });
});

describe('storage unavailable', () => {
  it('falls back to memory when localStorage is missing', async () => {
    const repository = createLocalStorageRepository(null);
    expect(repository.isPersistent).toBe(false);
    await repository.save(sample);
    expect(await repository.load()).toEqual(sample);
  });

  it('never throws when every storage call throws', async () => {
    const repository = createLocalStorageRepository(brokenStorage());
    await expect(repository.load()).resolves.toEqual({});
    await expect(repository.save(sample)).resolves.toBeUndefined();
    await expect(repository.clear()).resolves.toBeUndefined();
    expect(repository.isPersistent).toBe(false);
  });

  it('memory repository round-trips', async () => {
    const repository = createMemoryRepository();
    await repository.save(sample);
    expect(await repository.load()).toEqual(sample);
  });
});

describe('summarize', () => {
  it('counts per status and per chapter, missing entries being "À faire"', () => {
    const summary = summarize({
      ...sample,
      'JNG-PC-01': { status: 'review', note: '', updatedAt: '' },
    });
    expect(summary.total).toBe(14);
    expect(summary.counts).toEqual({ todo: 12, tried: 0, solved: 1, review: 1 });
    expect(summary.chapters).toHaveLength(14);
    const acids = summary.chapters.find((c) => c.chapter.includes('Acides faibles'));
    expect(acids?.counts.solved).toBe(1);
  });
});

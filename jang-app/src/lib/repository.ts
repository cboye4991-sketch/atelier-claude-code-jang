import { EXERCISES } from '../data/exercises';

export type ExerciseStatus = 'todo' | 'tried' | 'solved' | 'review';

export const STATUSES: readonly ExerciseStatus[] = ['todo', 'tried', 'solved', 'review'];

export const STATUS_LABELS: Record<ExerciseStatus, string> = {
  todo: 'À faire',
  tried: 'Essayé',
  solved: 'Réussi',
  review: 'À revoir',
};

export const NOTE_MAX_LENGTH = 280;

export interface NotebookEntry {
  status: ExerciseStatus;
  note: string;
  updatedAt: string;
}

/** Keyed by exercise ID (JNG-PC-xx). A missing key means "À faire" with no note. */
export type Notebook = Record<string, NotebookEntry>;

/**
 * Storage boundary for the student's notebook. The UI only talks to this interface,
 * so a Supabase or Firestore implementation can replace the localStorage one later.
 */
export interface NotebookRepository {
  load(): Promise<Notebook>;
  save(notebook: Notebook): Promise<void>;
  clear(): Promise<void>;
  /** False when data lives in memory only and will be lost on refresh. */
  readonly isPersistent: boolean;
}

export const STORAGE_KEY = 'jang.notebook.v1';

const KNOWN_IDS = new Set(EXERCISES.map((exercise) => exercise.id));

function isStatus(value: unknown): value is ExerciseStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** Keeps only well-formed entries for exercises that exist. Never throws. */
export function sanitizeNotebook(raw: unknown): Notebook {
  const notebook: Notebook = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return notebook;
  for (const [id, value] of Object.entries(raw)) {
    if (!KNOWN_IDS.has(id) || typeof value !== 'object' || value === null) continue;
    const { status, note, updatedAt } = value as Record<string, unknown>;
    if (!isStatus(status)) continue;
    notebook[id] = {
      status,
      note: typeof note === 'string' ? note.slice(0, NOTE_MAX_LENGTH) : '',
      updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
    };
  }
  return notebook;
}

/** Returns localStorage, or null when it is missing or throws (private mode, blocked cookies). */
function getStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = `${STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** In-memory fallback, also useful for tests. */
export function createMemoryRepository(): NotebookRepository {
  let memory: Notebook = {};
  return {
    isPersistent: false,
    load: () => Promise.resolve({ ...memory }),
    save: (notebook) => {
      memory = { ...notebook };
      return Promise.resolve();
    },
    clear: () => {
      memory = {};
      return Promise.resolve();
    },
  };
}

/**
 * localStorage-backed repository. If storage is unavailable, or a write fails (quota),
 * it keeps working in memory so the app never crashes.
 */
export function createLocalStorageRepository(storage: Storage | null = getStorage()): NotebookRepository {
  if (storage === null) return createMemoryRepository();
  const store = storage;
  let writable = true;
  let memory: Notebook = {};

  const repository: NotebookRepository = {
    get isPersistent() {
      return writable;
    },
    load() {
      try {
        const text = store.getItem(STORAGE_KEY);
        memory = text === null ? {} : sanitizeNotebook(JSON.parse(text));
      } catch {
        memory = {};
      }
      return Promise.resolve({ ...memory });
    },
    save(notebook) {
      memory = { ...notebook };
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(memory));
        writable = true;
      } catch {
        writable = false;
      }
      return Promise.resolve();
    },
    clear() {
      memory = {};
      try {
        store.removeItem(STORAGE_KEY);
      } catch {
        writable = false;
      }
      return Promise.resolve();
    },
  };
  return repository;
}

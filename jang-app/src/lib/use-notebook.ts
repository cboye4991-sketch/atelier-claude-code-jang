import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISES } from '../data/exercises';
import {
  NOTE_MAX_LENGTH,
  STATUSES,
  createLocalStorageRepository,
  type ExerciseStatus,
  type Notebook,
  type NotebookRepository,
} from './repository';

export interface ChapterCount {
  chapter: string;
  total: number;
  counts: Record<ExerciseStatus, number>;
}

export interface NotebookSummary {
  total: number;
  counts: Record<ExerciseStatus, number>;
  chapters: ChapterCount[];
}

export function getStatus(notebook: Notebook, id: string): ExerciseStatus {
  return notebook[id]?.status ?? 'todo';
}

function emptyCounts(): Record<ExerciseStatus, number> {
  return Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<ExerciseStatus, number>;
}

export function summarize(notebook: Notebook): NotebookSummary {
  const counts = emptyCounts();
  const byChapter = new Map<string, ChapterCount>();
  for (const exercise of EXERCISES) {
    const status = getStatus(notebook, exercise.id);
    counts[status] += 1;
    const chapter = byChapter.get(exercise.chapter) ?? {
      chapter: exercise.chapter,
      total: 0,
      counts: emptyCounts(),
    };
    chapter.total += 1;
    chapter.counts[status] += 1;
    byChapter.set(exercise.chapter, chapter);
  }
  return { total: EXERCISES.length, counts, chapters: [...byChapter.values()] };
}

export function useNotebook(repository?: NotebookRepository) {
  // One repository per app session; createLocalStorageRepository falls back to memory by itself.
  const repoRef = useRef<NotebookRepository>(repository ?? createLocalStorageRepository());
  const [notebook, setNotebook] = useState<Notebook>({});
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(repoRef.current.isPersistent);
  // Mirror of the latest state so quick successive edits never save a stale copy.
  const latest = useRef<Notebook>({});

  useEffect(() => {
    let cancelled = false;
    void repoRef.current.load().then((loaded) => {
      if (cancelled) return;
      latest.current = loaded;
      setNotebook(loaded);
      setPersistent(repoRef.current.isPersistent);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: Notebook) => {
    latest.current = next;
    setNotebook(next);
    void repoRef.current.save(next).then(() => setPersistent(repoRef.current.isPersistent));
  }, []);

  const setStatus = useCallback(
    (id: string, status: ExerciseStatus) => {
      const current = latest.current[id];
      commit({
        ...latest.current,
        [id]: { status, note: current?.note ?? '', updatedAt: new Date().toISOString() },
      });
    },
    [commit],
  );

  const setNote = useCallback(
    (id: string, note: string) => {
      const current = latest.current[id];
      commit({
        ...latest.current,
        [id]: {
          status: current?.status ?? 'todo',
          note: note.slice(0, NOTE_MAX_LENGTH),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [commit],
  );

  const reset = useCallback(() => {
    latest.current = {};
    setNotebook({});
    void repoRef.current.clear().then(() => setPersistent(repoRef.current.isPersistent));
  }, []);

  const summary = useMemo(() => summarize(notebook), [notebook]);

  return { notebook, ready, persistent, summary, setStatus, setNote, reset };
}

export type NotebookApi = ReturnType<typeof useNotebook>;

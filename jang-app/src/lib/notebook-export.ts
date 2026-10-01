import { EXERCISES } from '../data/exercises';
import type { ExerciseStatus, Notebook } from './repository';
import { getStatus } from './use-notebook';

export interface NotebookExportEntry {
  id: string;
  chapter: string;
  status: ExerciseStatus;
  note: string;
}

export interface NotebookExport {
  exportedAt: string;
  exercises: NotebookExportEntry[];
}

/**
 * Built field by field from public data (ID, chapter) and the student's own entries.
 * Never spread an exercise here: statements and anything answer-related must stay out.
 */
export function buildNotebookExport(notebook: Notebook, now: Date): NotebookExport {
  return {
    exportedAt: now.toISOString(),
    exercises: EXERCISES.map((exercise) => ({
      id: exercise.id,
      chapter: exercise.chapter,
      status: getStatus(notebook, exercise.id),
      note: notebook[exercise.id]?.note ?? '',
    })),
  };
}

/** `jang-carnet-AAAA-MM-JJ.json`, from the local date. */
export function exportFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `jang-carnet-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Local download only: no network request. */
export function downloadNotebookExport(data: NotebookExport, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

import { useState } from 'react';
import type { Exercise } from '../data/exercises';
import { getChapterTitle } from '../lib/exercise-utils';
import { NOTE_MAX_LENGTH, type ExerciseStatus } from '../lib/repository';
import { StatusPicker } from './StatusPicker';

interface NotebookRowProps {
  exercise: Exercise;
  status: ExerciseStatus;
  note: string;
  onStatusChange: (status: ExerciseStatus) => void;
  onNoteChange: (note: string) => void;
}

export function NotebookRow({ exercise, status, note, onStatusChange, onNoteChange }: NotebookRowProps) {
  const noteId = `note-${exercise.id}`;
  // Start open when a note already exists; after that the student decides.
  const [open, setOpen] = useState(note !== '');
  return (
    <li className="notebook-row">
      <div className="row-head">
        <span className="exercise-id mono">{exercise.id}</span>
        <span className="row-title">{getChapterTitle(exercise.chapter)}</span>
      </div>
      <StatusPicker exerciseId={exercise.id} value={status} onChange={onStatusChange} />
      <details className="note" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary>{note === '' ? 'Ajouter une note' : 'Ma note'}</summary>
        <label className="sr-only" htmlFor={noteId}>
          Note privée pour {exercise.id}
        </label>
        <textarea
          id={noteId}
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Ce que tu dois retenir…"
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <p className="counter">
          Privée, gardée sur ce téléphone · {note.length}/{NOTE_MAX_LENGTH}
        </p>
      </details>
    </li>
  );
}

import { lazy, Suspense } from 'react';
import type { Exercise } from '../data/exercises';
import { getChapterTitle, getSubject, getValidationLabel } from '../lib/exercise-utils';
import { STATUS_LABELS, type ExerciseStatus } from '../lib/repository';

// The chat is only needed after a click: keep it out of the first load.
const CorrectionPanel = lazy(() => import('./CorrectionPanel'));

interface ExerciseCardProps {
  exercise: Exercise;
  status: ExerciseStatus;
  open: boolean;
  onToggle: () => void;
  onSetStatus: (status: ExerciseStatus) => void;
}

export function ExerciseCard({ exercise, status, open, onToggle, onSetStatus }: ExerciseCardProps) {
  const subject = getSubject(exercise.chapter);
  const subjectClass = subject === 'Chimie' ? 'chimie' : 'physique';
  const panelId = `chat-${exercise.id}`;

  return (
    <li className={`card card-${subjectClass}`}>
      <div className="card-head">
        <span className="exercise-id mono">{exercise.id}</span>
        <span className="subject-tag">
          <span className={`dot dot-${subjectClass}`} aria-hidden="true" />
          {subject}
        </span>
        <span className="status-pill" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <h3>{getChapterTitle(exercise.chapter)}</h3>
      <p className="statement">{exercise.statement}</p>
      {exercise.data && (
        <p className="data-block mono">
          <span className="data-title">Données</span>
          {exercise.data}
        </p>
      )}
      <p className="badge">{getValidationLabel(exercise.validation)}</p>
      <div className="card-actions">
        <button type="button" className="btn" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          Corriger avec Jàng
        </button>
      </div>
      {open && (
        <Suspense fallback={<p className="hint">Chargement…</p>}>
          <CorrectionPanel exerciseId={exercise.id} onSetStatus={onSetStatus} />
        </Suspense>
      )}
    </li>
  );
}

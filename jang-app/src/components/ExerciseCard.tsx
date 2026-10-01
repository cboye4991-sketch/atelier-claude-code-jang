import type { Exercise } from '../data/exercises';
import { getChapterTitle, getSubject, getValidationLabel } from '../lib/exercise-utils';
import { STATUS_LABELS, type ExerciseStatus } from '../lib/repository';

interface ExerciseCardProps {
  exercise: Exercise;
  status: ExerciseStatus;
}

export function ExerciseCard({ exercise, status }: ExerciseCardProps) {
  const subject = getSubject(exercise.chapter);
  const subjectClass = subject === 'Chimie' ? 'chimie' : 'physique';
  const hintId = `${exercise.id}-soon`;

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
        <button type="button" className="btn" disabled aria-describedby={hintId}>
          Corriger avec Jàng
        </button>
        <p className="hint" id={hintId}>
          Bientôt : correction en direct (phase 2)
        </p>
      </div>
    </li>
  );
}

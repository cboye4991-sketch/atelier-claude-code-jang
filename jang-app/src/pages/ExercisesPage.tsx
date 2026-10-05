import { useMemo, useState } from 'react';
import { ExerciseCard } from '../components/ExerciseCard';
import { ProgressStrip } from '../components/ProgressStrip';
import { SearchFilters } from '../components/SearchFilters';
import { EXERCISES } from '../data/exercises';
import { filterExercises, type StatusFilter, type SubjectFilter } from '../lib/exercise-utils';
import { getStatus, type NotebookSummary } from '../lib/use-notebook';
import type { ExerciseStatus, Notebook } from '../lib/repository';

interface ExercisesPageProps {
  notebook: Notebook;
  summary: NotebookSummary;
  onSetStatus: (id: string, status: ExerciseStatus) => void;
}

export function ExercisesPage({ notebook, summary, onSetStatus }: ExercisesPageProps) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>('all');
  // One correction panel open at a time.
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const visible = useMemo(
    () =>
      filterExercises(EXERCISES, query, subject).filter(
        (exercise) => statusFilter === 'all' || getStatus(notebook, exercise.id) === statusFilter,
      ),
    [query, subject, statusFilter, notebook],
  );

  return (
    <>
      <ProgressStrip summary={summary} />
      <SearchFilters
        query={query}
        subject={subject}
        status={statusFilter}
        onQueryChange={setQuery}
        onSubjectChange={setSubject}
        onStatusChange={setStatusFilter}
      />
      <p className="result-count" role="status">
        {visible.length} exercice{visible.length > 1 ? 's' : ''} sur {EXERCISES.length}
      </p>
      {visible.length === 0 ? (
        <p className="empty">
          Aucun exercice ne correspond. Essaie un autre mot, ou change un filtre.
        </p>
      ) : (
        <ul className="card-list">
          {visible.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              status={getStatus(notebook, exercise.id)}
              open={openId === exercise.id}
              onToggle={() => setOpenId((current) => (current === exercise.id ? null : exercise.id))}
              onSetStatus={(next) => onSetStatus(exercise.id, next)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

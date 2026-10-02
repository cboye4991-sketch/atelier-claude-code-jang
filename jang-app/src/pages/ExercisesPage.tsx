import { useMemo, useState } from 'react';
import { ExerciseCard } from '../components/ExerciseCard';
import { SearchFilters } from '../components/SearchFilters';
import { EXERCISES } from '../data/exercises';
import { filterExercises, type SubjectFilter } from '../lib/exercise-utils';
import { getStatus } from '../lib/use-notebook';
import type { ExerciseStatus, Notebook } from '../lib/repository';

interface ExercisesPageProps {
  notebook: Notebook;
  onSetStatus: (id: string, status: ExerciseStatus) => void;
}

export function ExercisesPage({ notebook, onSetStatus }: ExercisesPageProps) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>('all');
  // One correction panel open at a time.
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = useMemo(() => filterExercises(EXERCISES, query, subject), [query, subject]);

  return (
    <>
      <SearchFilters query={query} subject={subject} onQueryChange={setQuery} onSubjectChange={setSubject} />
      <p className="result-count" role="status">
        {visible.length} exercice{visible.length > 1 ? 's' : ''} sur {EXERCISES.length}
      </p>
      {visible.length === 0 ? (
        <p className="empty">
          Aucun exercice ne correspond. Essaie un autre mot, ou choisis « Tout ».
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

import type { StatusFilter, SubjectFilter } from '../lib/exercise-utils';

interface SearchFiltersProps {
  query: string;
  subject: SubjectFilter;
  status: StatusFilter;
  onQueryChange: (query: string) => void;
  onSubjectChange: (subject: SubjectFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
}

const OPTIONS: { value: SubjectFilter; label: string; dot?: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'Chimie', label: 'Chimie', dot: 'dot-chimie' },
  { value: 'Physique', label: 'Physique', dot: 'dot-physique' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'todo', label: 'À faire' },
  { value: 'review', label: 'À revoir' },
  { value: 'solved', label: 'Réussi' },
];

export function SearchFilters({
  query,
  subject,
  status,
  onQueryChange,
  onSubjectChange,
  onStatusChange,
}: SearchFiltersProps) {
  return (
    <div className="toolbar" role="search">
      <div>
        <label className="field-label" htmlFor="exercise-search">
          Cherche un exercice
        </label>
        <input
          id="exercise-search"
          className="text-input"
          type="search"
          placeholder="pH, newton, JNG-PC-05…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="chips" role="group" aria-label="Filtrer par matière">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="chip"
            aria-pressed={subject === option.value}
            onClick={() => onSubjectChange(option.value)}
          >
            {option.dot && <span className={`dot ${option.dot}`} aria-hidden="true" />}
            {option.label}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Filtrer par statut">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className="chip chip-small"
            aria-pressed={status === option.value}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

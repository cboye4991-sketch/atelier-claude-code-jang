import type { SubjectFilter } from '../lib/exercise-utils';

interface SearchFiltersProps {
  query: string;
  subject: SubjectFilter;
  onQueryChange: (query: string) => void;
  onSubjectChange: (subject: SubjectFilter) => void;
}

const OPTIONS: { value: SubjectFilter; label: string; dot?: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'Chimie', label: 'Chimie', dot: 'dot-chimie' },
  { value: 'Physique', label: 'Physique', dot: 'dot-physique' },
];

export function SearchFilters({ query, subject, onQueryChange, onSubjectChange }: SearchFiltersProps) {
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
    </div>
  );
}

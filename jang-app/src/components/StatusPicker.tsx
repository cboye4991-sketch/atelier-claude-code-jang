import { STATUSES, STATUS_LABELS, type ExerciseStatus } from '../lib/repository';

interface StatusPickerProps {
  exerciseId: string;
  value: ExerciseStatus;
  onChange: (status: ExerciseStatus) => void;
}

export function StatusPicker({ exerciseId, value, onChange }: StatusPickerProps) {
  return (
    <fieldset>
      <legend className="sr-only">Où en es-tu sur {exerciseId} ?</legend>
      <div className="status-picker">
        {STATUSES.map((status) => (
          <label key={status} className="status-option">
            <input
              type="radio"
              name={`status-${exerciseId}`}
              value={status}
              checked={value === status}
              onChange={() => onChange(status)}
            />
            <span data-status={status}>{STATUS_LABELS[status]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

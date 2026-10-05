import type { NotebookSummary } from '../lib/use-notebook';

interface ProgressStripProps {
  summary: NotebookSummary;
}

/** Compact overall progress shown above the catalogue. */
export function ProgressStrip({ summary }: ProgressStripProps) {
  const { total, counts } = summary;
  const percent = (count: number) => `${(count / total) * 100}%`;

  return (
    <section className="strip" aria-label="Ma progression">
      <p className="strip-line">
        <strong>
          {counts.solved} réussi{counts.solved > 1 ? 's' : ''}
        </strong>{' '}
        sur {total}
        {counts.review > 0 && <span className="strip-extra"> · {counts.review} à revoir</span>}
      </p>
      <div
        className="progress-bar"
        role="img"
        aria-label={`${counts.solved} réussis, ${counts.tried} essayés, ${counts.review} à revoir, ${counts.todo} à faire`}
      >
        <span className="seg-solved" style={{ width: percent(counts.solved) }} />
        <span className="seg-tried" style={{ width: percent(counts.tried) }} />
        <span className="seg-review" style={{ width: percent(counts.review) }} />
      </div>
    </section>
  );
}

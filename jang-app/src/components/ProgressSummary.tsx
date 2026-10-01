import { getChapterTitle, getSubject } from '../lib/exercise-utils';
import { STATUS_LABELS } from '../lib/repository';
import type { NotebookSummary } from '../lib/use-notebook';

interface ProgressSummaryProps {
  summary: NotebookSummary;
}

const BAR_STATUSES = ['solved', 'tried', 'review'] as const;

export function ProgressSummary({ summary }: ProgressSummaryProps) {
  const { total, counts, chapters } = summary;
  const touched = total - counts.todo;

  return (
    <section className="panel" aria-labelledby="progress-title">
      <h2 id="progress-title">Ma progression</h2>
      <p className="progress-line">
        {counts.solved} réussi{counts.solved > 1 ? 's' : ''} sur {total}
        {touched > 0 && ` · ${touched} commencé${touched > 1 ? 's' : ''}`}
      </p>
      <div
        className="progress-bar"
        role="img"
        aria-label={`${counts.solved} réussis, ${counts.tried} essayés, ${counts.review} à revoir, ${counts.todo} à faire`}
      >
        {BAR_STATUSES.map((status) => (
          <span key={status} className={`seg-${status}`} style={{ width: `${(counts[status] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="legend">
        {BAR_STATUSES.map((status) => (
          <li key={status}>
            {STATUS_LABELS[status]} : {counts[status]}
          </li>
        ))}
        <li>
          {STATUS_LABELS.todo} : {counts.todo}
        </li>
      </ul>

      <h3 className="sr-only">Par chapitre</h3>
      <ul className="chapter-list">
        {chapters.map((chapter) => (
          <li key={chapter.chapter} className="chapter-row">
            <span className="chapter-name">
              <span
                className={`dot dot-${getSubject(chapter.chapter) === 'Chimie' ? 'chimie' : 'physique'}`}
                aria-hidden="true"
              />{' '}
              {getChapterTitle(chapter.chapter)}
            </span>
            <strong>
              {chapter.counts.solved}/{chapter.total} réussi{chapter.counts.solved > 1 ? 's' : ''}
            </strong>
            <span className="chapter-count">
              {chapter.counts.tried} essayé · {chapter.counts.review} à revoir · {chapter.counts.todo} à faire
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

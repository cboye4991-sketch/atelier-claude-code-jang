import { ExportNotebook } from '../components/ExportNotebook';
import { NotebookRow } from '../components/NotebookRow';
import { ProgressSummary } from '../components/ProgressSummary';
import { ResetNotebook } from '../components/ResetNotebook';
import { EXERCISES } from '../data/exercises';
import { getStatus, type NotebookApi } from '../lib/use-notebook';

interface NotebookPageProps {
  api: NotebookApi;
}

export function NotebookPage({ api }: NotebookPageProps) {
  const { notebook, ready, persistent, summary, setStatus, setNote, reset } = api;

  if (!ready) return <p className="empty">Ton carnet se charge…</p>;

  const isEmpty = Object.keys(notebook).length === 0;

  return (
    <>
      {!persistent && (
        <p className="notice" role="status">
          Ton carnet ne sera pas gardé si tu fermes la page.
        </p>
      )}
      {isEmpty && (
        <p className="empty">
          Ton carnet est vide pour l'instant. Corrige un exercice dans l'onglet Exercices, ou choisis un statut ci-dessous.
        </p>
      )}
      <ProgressSummary summary={summary} />
      <section className="panel" aria-labelledby="notebook-title">
        <h2 id="notebook-title">Mes exercices</h2>
        <p className="hint">Choisis où tu en es. Ta note reste privée, sur ce téléphone.</p>
        <ul className="card-list" style={{ gap: 0, marginTop: 8 }}>
          {EXERCISES.map((exercise) => (
            <NotebookRow
              key={exercise.id}
              exercise={exercise}
              status={getStatus(notebook, exercise.id)}
              note={notebook[exercise.id]?.note ?? ''}
              onStatusChange={(status) => setStatus(exercise.id, status)}
              onNoteChange={(note) => setNote(exercise.id, note)}
            />
          ))}
        </ul>
      </section>
      <div className="notebook-actions">
        <ExportNotebook notebook={notebook} disabled={isEmpty} />
        <ResetNotebook onConfirm={reset} disabled={isEmpty} />
      </div>
    </>
  );
}

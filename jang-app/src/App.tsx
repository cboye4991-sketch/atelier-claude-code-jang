import { useState } from 'react';
import { useNotebook } from './lib/use-notebook';
import { ExercisesPage } from './pages/ExercisesPage';
import { NotebookPage } from './pages/NotebookPage';

type Tab = 'exercises' | 'notebook';

const TABS: { id: Tab; label: string }[] = [
  { id: 'exercises', label: 'Exercices' },
  { id: 'notebook', label: 'Mon carnet' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('exercises');
  const notebookApi = useNotebook();

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="brand">Jàng</h1>
          <p className="tagline">Tu révises seul ? Jàng te montre où tu t'es trompé.</p>
          <div className="tabs" role="tablist" aria-label="Sections">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`panel-${item.id}`}
                className="tab"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        <div className="container" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'exercises' ? (
            <ExercisesPage notebook={notebookApi.notebook} onSetStatus={notebookApi.setStatus} />
          ) : (
            <NotebookPage api={notebookApi} />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Corrigés en cours de validation par des professeurs.</p>
          <p>Jàng — réviser seul, mais pas sans aide.</p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import type { Notebook } from '../lib/repository';
import { buildNotebookExport, downloadNotebookExport, exportFileName } from '../lib/notebook-export';

interface ExportNotebookProps {
  notebook: Notebook;
  disabled: boolean;
}

export function ExportNotebook({ notebook, disabled }: ExportNotebookProps) {
  const [exportedName, setExportedName] = useState<string | null>(null);

  function handleClick() {
    const now = new Date();
    const fileName = exportFileName(now);
    downloadNotebookExport(buildNotebookExport(notebook, now), fileName);
    setExportedName(fileName);
  }

  return (
    <>
      <button type="button" className="btn btn-quiet" disabled={disabled} onClick={handleClick}>
        Exporter mon carnet
      </button>
      {exportedName !== null && (
        <p className="hint" role="status">
          Fichier {exportedName} téléchargé.
        </p>
      )}
    </>
  );
}

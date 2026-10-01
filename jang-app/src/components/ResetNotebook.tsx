import { useState } from 'react';

interface ResetNotebookProps {
  onConfirm: () => void;
  disabled: boolean;
}

/** In-page confirmation: window.confirm is never used. */
export function ResetNotebook({ onConfirm, disabled }: ResetNotebookProps) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" className="btn btn-quiet" disabled={disabled} onClick={() => setAsking(true)}>
        Remettre mon carnet à zéro
      </button>
    );
  }

  return (
    <div className="confirm" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-text">
      <h3 id="reset-title">Tout effacer ?</h3>
      <p id="reset-text">Tous tes statuts et toutes tes notes seront supprimés. Tu ne pourras pas les récupérer.</p>
      <div className="row">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            onConfirm();
            setAsking(false);
          }}
        >
          Oui, tout effacer
        </button>
        <button type="button" className="btn btn-quiet" autoFocus onClick={() => setAsking(false)}>
          Non, je garde mon carnet
        </button>
      </div>
    </div>
  );
}

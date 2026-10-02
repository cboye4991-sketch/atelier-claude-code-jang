import { useEffect, useId, useRef, useState } from 'react';
import { QUERY_MAX_LENGTH, QUERY_MIN_LENGTH } from '../lib/config';
import { corriger, type CorrectionResult } from '../lib/correction-client';
import { STATUS_LABELS, type ExerciseStatus } from '../lib/repository';

interface CorrectionPanelProps {
  exerciseId: string;
  onSetStatus: (status: ExerciseStatus) => void;
}

type Message =
  | { id: number; from: 'eleve'; text: string }
  | { id: number; from: 'jang'; result: CorrectionResult };

const DISCLAIMER = 'Jàng peut se tromper : en cas de doute, demande à un professeur.';

/** WhatsApp-style panel under an exercise card. Text only: answers are never injected as HTML. */
export default function CorrectionPanel({ exerciseId, onSetStatus }: CorrectionPanelProps) {
  const [draft, setDraft] = useState(`${exerciseId} : `);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [chosen, setChosen] = useState<ExerciseStatus | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const fieldId = useId();

  // Closing the panel (or opening another card) cancels the request in flight.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const tooShort = draft.trim().length < QUERY_MIN_LENGTH;

  async function request(query: string) {
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setChosen(null);
    const result = await corriger(query, { signal: controller.signal });
    if (controller.signal.aborted) return;
    setPending(false);
    setMessages((previous) => [...previous, { id: nextId.current++, from: 'jang', result }]);
  }

  function send() {
    const query = draft.trim();
    if (pending || query.length < QUERY_MIN_LENGTH) return;
    setLastQuery(query);
    setMessages((previous) => [...previous, { id: nextId.current++, from: 'eleve', text: query }]);
    setDraft(`${exerciseId} : `);
    void request(query);
  }

  function choose(status: ExerciseStatus) {
    setChosen(status);
    onSetStatus(status);
  }

  const last = messages[messages.length - 1];
  const showStatusChoice = !pending && last?.from === 'jang' && last.result.kind === 'correction';
  const showRetry = !pending && last?.from === 'jang' && last.result.kind === 'erreur' && lastQuery !== '';

  return (
    <div className="chat" id={`chat-${exerciseId}`}>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-intro">Écris ta réponse ci-dessous. Jàng te montre ta première erreur.</p>
        )}
        {messages.map((message) =>
          message.from === 'eleve' ? (
            <p key={message.id} className="bubble bubble-eleve">
              {message.text}
            </p>
          ) : (
            <div key={message.id} className="bubble bubble-jang" data-kind={message.result.kind}>
              <p className="bubble-text">{message.result.text}</p>
              {message.result.kind === 'correction' && <p className="disclaimer">{DISCLAIMER}</p>}
            </div>
          ),
        )}
        <div role="status" className="chat-live">
          {pending && (
            <p className="bubble bubble-jang typing">
              Jàng écrit
              <span className="dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="typing-hint">Ça peut prendre jusqu'à 40 secondes.</span>
            </p>
          )}
        </div>
      </div>

      {showStatusChoice && (
        <div className="chat-status">
          <button type="button" className="btn" aria-pressed={chosen === 'solved'} onClick={() => choose('solved')}>
            J'ai compris → Réussi
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            aria-pressed={chosen === 'review'}
            onClick={() => choose('review')}
          >
            À revoir
          </button>
          {chosen && <p className="hint">C'est noté dans ton carnet : {STATUS_LABELS[chosen]}.</p>}
        </div>
      )}
      {showRetry && (
        <div className="chat-status">
          <button type="button" className="btn btn-quiet" onClick={() => void request(lastQuery)}>
            Réessayer
          </button>
        </div>
      )}

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor={fieldId} className="chat-label">
          Ta réponse
        </label>
        <textarea
          id={fieldId}
          className="chat-input"
          rows={4}
          maxLength={QUERY_MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn" disabled={pending || tooShort}>
          Envoyer
        </button>
      </form>
    </div>
  );
}

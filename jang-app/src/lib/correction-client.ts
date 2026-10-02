import {
  ANSWER_MAX_LENGTH,
  CORRECTION_TIMEOUT_MS,
  QUERY_MAX_LENGTH,
  QUERY_MIN_LENGTH,
  RELAIS_URL,
} from './config';

export type CorrectionResult =
  | { kind: 'correction'; text: string }
  /** The request is out of scope: show the text as is. */
  | { kind: 'refus'; text: string }
  | { kind: 'erreur'; text: string };

export const MESSAGE_UNAVAILABLE = 'Jàng est indisponible pour le moment — réessaie dans une minute';
export const MESSAGE_TIMEOUT = 'La réponse prend trop de temps — réessaie';
export const MESSAGE_QUERY_LENGTH = `Écris entre ${QUERY_MIN_LENGTH} et ${QUERY_MAX_LENGTH} caractères.`;
export const MESSAGE_TRUNCATED = '\n\n[Message coupé : il était trop long.]';

export interface CorrigerOptions {
  /** Aborting (panel closed) stops the request; the caller ignores the result. */
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const unavailable = (): CorrectionResult => ({ kind: 'erreur', text: MESSAGE_UNAVAILABLE });

function limit(text: string): string {
  return text.length > ANSWER_MAX_LENGTH ? text.slice(0, ANSWER_MAX_LENGTH) + MESSAGE_TRUNCATED : text;
}

function parseBody(body: unknown): CorrectionResult | null {
  if (typeof body !== 'object' || body === null) return null;
  const { type, text } = body as Record<string, unknown>;
  if (typeof text !== 'string' || text.trim() === '') return null;
  if (type === 'correction' || type === 'refus' || type === 'erreur') {
    return { kind: type, text: limit(text) };
  }
  return null;
}

/** Sends the student's work to the relay. Never throws: every failure becomes an `erreur` result. */
export async function corriger(query: string, options: CorrigerOptions = {}): Promise<CorrectionResult> {
  const { signal, fetchImpl = fetch, timeoutMs = CORRECTION_TIMEOUT_MS } = options;
  const trimmed = query.trim();
  if (trimmed.length < QUERY_MIN_LENGTH || trimmed.length > QUERY_MAX_LENGTH) {
    return { kind: 'erreur', text: MESSAGE_QUERY_LENGTH };
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const response = await fetchImpl(RELAIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed }),
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    return parseBody(body) ?? unavailable();
  } catch {
    return timedOut ? { kind: 'erreur', text: MESSAGE_TIMEOUT } : unavailable();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

const DEFAULT_RELAIS_URL = 'https://jang-relay.jang-bac.workers.dev/corriger';

/** Public relay that holds the Dify key. The URL is not a secret. */
export const RELAIS_URL: string = import.meta.env.VITE_RELAIS_URL?.trim() || DEFAULT_RELAIS_URL;

/** Gemini free tier can take 4 to 40 s; leave margin for a slow connection. */
export const CORRECTION_TIMEOUT_MS = 65_000;
export const QUERY_MIN_LENGTH = 3;
export const QUERY_MAX_LENGTH = 1000;
/** A correction message stays under 100 KB (characters used as a close, safe proxy). */
export const ANSWER_MAX_LENGTH = 100_000;

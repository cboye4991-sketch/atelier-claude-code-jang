/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override of the correction relay URL (public, not a secret). */
  readonly VITE_RELAIS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

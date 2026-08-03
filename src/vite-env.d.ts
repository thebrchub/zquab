/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_BASE_URL?: string;
  readonly VITE_EMAIL_API_URL?: string;
  readonly VITE_EMAIL_API_KEY?: string;
  readonly VITE_EMAIL_BRAND?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

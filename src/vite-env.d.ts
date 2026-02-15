/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string; // backend URL
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
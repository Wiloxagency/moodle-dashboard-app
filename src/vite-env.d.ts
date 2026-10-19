/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENVIRONMENT: string
  /** Sólo desarrollo: simula que el sitio se abre desde este dominio White Label. */
  readonly VITE_WL_HOST?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

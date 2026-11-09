declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    /** Публичный путь для сборки (нужен GitHub Pages project site: /<repo>/). */
    PUBLIC_PATH?: string;
  }
}

interface ImportMetaEnv {
  /**
   * Режим mock API: 'true' — всегда мок (демо без сервера), 'fallback' — реальный
   * бэкенд, при его недоступности мок (см. src/mock/mode.ts), 'false' — только бэкенд.
   */
  readonly VITE_MOCK_API?: string;
  /** Реальный адрес API; если задан и mock выключен, запросы идут на этот origin. */
  readonly VITE_API_URL?: string;
}


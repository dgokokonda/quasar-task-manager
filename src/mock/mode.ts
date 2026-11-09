/**
 * Режимы mock API (используется src/boot/mock-api.ts).
 *
 *  - 'off'       — мок выключен, запросы идут на реальный бэкенд (нужен npm run server);
 *  - 'intercept' — мок перехватывает все /api/* (демо-сборка на GitHub Pages);
 *  - 'fallback'  — сначала пробуем реальный бэкенд; если он недоступен, включаем мок.
 *                  Удобно для npm run dev: не нужно помнить про npm run server.
 */
export type MockMode = 'off' | 'intercept' | 'fallback';

const ON_VALUES = ['1', 'true', 'on'];
const OFF_VALUES = ['0', 'false', 'off'];
const FALLBACK_VALUES = ['fallback', 'auto'];

export interface ResolveModeOptions {
  /** Значение из URL: ?mock=on|off|fallback. */
  queryValue?: string | null;
  /** Значение import.meta.env.VITE_MOCK_API (в dev это «fallback»). */
  envValue?: string | undefined;
}

export function resolveMockMode(options: ResolveModeOptions = {}): MockMode {
  const fromQuery = (options.queryValue ?? '').trim().toLowerCase();
  if (ON_VALUES.includes(fromQuery)) return 'intercept';
  if (FALLBACK_VALUES.includes(fromQuery)) return 'fallback';
  if (OFF_VALUES.includes(fromQuery)) return 'off';

  const fromEnv = (options.envValue ?? '').trim().toLowerCase();
  if (ON_VALUES.includes(fromEnv)) return 'intercept';
  if (FALLBACK_VALUES.includes(fromEnv)) return 'fallback';
  return 'off';
}

/**
 * Проверка, жив ли реальный бэкенд. Любой ответ (даже 4xx/5xx) говорит «порт занят»,
 * но при недоступном сервере Vite-прокси отвечает 500 c content-type text/plain.
 * Ответ приложения (в том числе ошибки сервера) — application/json.
 */
export function isBackendAlive(response: {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
}): boolean {
  if (response.ok) return true;

  const contentType = response.headers.get('content-type') ?? '';
  // 5xx от прокси (бэкенд не запущен/упал) — считаем бэкенд недоступным.
  if (response.status >= 500 && !contentType.includes('application/json')) return false;

  // Ошибка самого бэкенда: он живой, мок включать не нужно.
  return true;
}

/** Делает probe-запрос с таймаутом. Бросать наружу ничего не должно. */
export async function probeBackend(
  fetchImpl: (
    url: string,
    init?: RequestInit,
  ) => Promise<{
    ok: boolean;
    status: number;
    headers: { get(name: string): string | null };
  }>,
  url = '/api/users',
  timeoutMs = 3000,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    return isBackendAlive(response);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

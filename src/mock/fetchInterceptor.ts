/**
 * Перехват запросов fetch в браузере: запросы клиента на /api/* обрабатываются
 * локально (src/mock/handlers.ts), сеть не используется. Клиентский код
 * (src/services/*, src/stores/*) не меняется — baseUrl остался «/api».
 */
import { getDb, persistDb } from './db';
import { handleMockRequest, type MockReply } from './handlers';

const API_PREFIX = '/api';
const DEFAULT_LATENCY_MS = 120;
const FALLBACK_ORIGIN = 'http://localhost/';

export interface MockFetchOptions {
  /** publicPath приложения: /quasar-task-manager/ для GitHub Pages project site. */
  base?: string;
  /** Искусственная задержка ответа, чтобы UI (загрузка, спиннеры) вёл себя как с сетью. */
  latencyMs?: number;
}

function normalizeBase(base: string | undefined): string {
  if (!base || base === '/' || base === './') return '/';
  return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Превращает URL запроса в путь ресурса без /api (как это делает серверный pathname()).
 * Возвращает null, если запрос идёт мимо mock API (другой origin или другой путь).
 */
export function resolveApiPath(rawUrl: string, base?: string): string | null {
  const locationHref = globalThis.location?.href;

  let url: URL;
  try {
    url = new URL(rawUrl, locationHref ?? FALLBACK_ORIGIN);
  } catch {
    return null;
  }

  // Запрос на реальный API на другом домене (VITE_API_URL) — не перехватываем.
  if (locationHref && url.origin !== new URL(locationHref).origin) return null;

  const normalizedBase = normalizeBase(base);
  let path = url.pathname;

  if (normalizedBase !== '/' && path.startsWith(normalizedBase)) {
    path = `/${path.slice(normalizedBase.length)}`;
  }

  if (path === API_PREFIX) path = '/';
  else if (path.startsWith(`${API_PREFIX}/`)) path = path.slice(API_PREFIX.length) || '/';
  else return null;

  return path;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function readJsonBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const rawBody = init?.body ?? (input instanceof Request ? await input.clone().text() : null);

  if (typeof rawBody === 'string' && rawBody.length > 0) {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return {}; // серверный readBody() тоже отдаёт {} на битом JSON
    }
  }

  return {};
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function toResponse(reply: MockReply, latencyMs: number): Promise<Response> {
  const payload = reply.body === undefined ? '' : JSON.stringify(reply.body);
  await delay(latencyMs);

  return new Response(payload, {
    status: reply.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Подменяет globalThis.fetch. Возвращает функцию отключения (удобно для dev/тестов).
 */
export function installMockFetch(options: MockFetchOptions = {}): () => void {
  const base = options.base;
  const latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = requestUrl(input);
    const path = resolveApiPath(rawUrl, base);

    if (path === null) return originalFetch(input, init);

    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    let url: URL;
    try {
      url = new URL(rawUrl, globalThis.location?.href ?? FALLBACK_ORIGIN);
    } catch {
      return originalFetch(input, init);
    }

    try {
      const body = await readJsonBody(input, init);
      const reply = handleMockRequest({
        method,
        path,
        searchParams: url.searchParams,
        body,
        db: getDb(),
      });

      if (reply.mutated) persistDb();

      return await toResponse(reply, latencyMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mock API error';
      return await toResponse({ status: 500, body: { error: message } }, latencyMs);
    }
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

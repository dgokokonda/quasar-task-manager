import { boot } from 'quasar/wrappers';
import { DEMO_SEED_FILE, flushDb, initMockDb, resetMockDb } from '@/mock/db';
import { installMockFetch } from '@/mock/fetchInterceptor';
import { probeBackend, resolveMockMode } from '@/mock/mode';

/**
 * Подключение mock API (src/mock/*) — он отвечает на /api/* прямо в браузере.
 *
 * Режим задаёт VITE_MOCK_API (см. .env.development / .env.production) или урл:
 *   ?mock=on       — всегда мок (демо на статическом хостинге);
 *   ?mock=fallback — реальный бэкенд, а если он недоступен — мок (режим npm run dev);
 *   ?mock=off      — всегда реальный бэкенд (нужен запущенный npm run server);
 *   ?resetDemo=1   — сбросить состояние демо в localStorage к исходному сид-файлу.
 *
 * Почему это важно: без бэкенда Vite-прокси отвечает на /api/* «500» (Error occurred
 * while trying to proxy), и в UI падают все запросы. В fallback-режиме это лечится
 * автоматически — мок подхватывает запросы, если сервер не запущен.
 */
function queryValue(name: string): string | null {
  return new URLSearchParams(globalThis.location?.search ?? '').get(name);
}

function normalizeBase(base: string): string {
  return base.endsWith('/') ? base : `${base}/`;
}

export default boot(async () => {
  const mode = resolveMockMode({
    queryValue: queryValue('mock'),
    envValue: import.meta.env.VITE_MOCK_API,
  });

  if (mode === 'off') return;

  const base = import.meta.env.BASE_URL || '/';
  const seedOptions = { seedUrl: `${normalizeBase(base)}${DEMO_SEED_FILE}` };

  if (mode === 'fallback') {
    const alive = await probeBackend((url, init) => globalThis.fetch(url, init));

    if (alive) {
      console.info('[mock-api] реальный бэкенд на /api доступен — мок не включается.');
      return;
    }

    console.warn(
      '[mock-api] бэкенд на /api недоступен (обычно это 500 «Error occurred while trying to ' +
        'proxy» от Vite — не запущен npm run server). Включаю mock API: данные из ' +
        'public/mock/db.json, изменения хранятся в localStorage. Вернуть настоящий сервер: ' +
        'npm run server (порт 3000) + перезагрузить страницу, либо ?mock=off.',
    );
  }

  try {
    if (queryValue('resetDemo') !== null) {
      await resetMockDb(seedOptions);

      // Убираем resetDemo из URL, чтобы повторное открытие страницы не сбрасывало данные.
      const url = new URL(globalThis.location.href);
      url.searchParams.delete('resetDemo');
      globalThis.history?.replaceState(
        globalThis.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
    } else {
      await initMockDb(seedOptions);
    }
  } catch (error) {
    // Не роняем запуск приложения: без данных демо UI просто покажет ошибку загрузки.
    console.error('[mock-api] не удалось загрузить демо-данные:', error);
    return;
  }

  installMockFetch({ base });

  // Сохраняем состояние, если вкладку закрыли/свернули до срабатывания debounce.
  globalThis.addEventListener?.('pagehide', () => {
    flushDb();
  });
  globalThis.addEventListener?.('visibilitychange', () => {
    if (globalThis.document?.visibilityState === 'hidden') flushDb();
  });

  console.info(
    '[mock-api] демо-режим: запросы /api/* обрабатываются в браузере, состояние хранится в localStorage',
  );
});

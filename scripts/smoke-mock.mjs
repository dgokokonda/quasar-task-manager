/**
 * Смоук-тест mock API (без браузера): прогоняет src/mock/{db,handlers}.ts через esbuild
 * и проверяет ключевые сценарии демо — пагинацию, фильтры, сортировку, CRUD и drag&drop дельту.
 *
 * Запуск: npm run test:mock
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = mkdtempSync(join(tmpdir(), 'mock-smoke-'));

const failures = [];
function check(name, condition, extra = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name} ${extra}`);
  }
}

try {
  const bundleFile = join(tmpDir, 'mock.mjs');
  await build({
    entryPoints: [join(projectRoot, 'scripts', 'mock-smoke-entry.ts')],
    outfile: bundleFile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    absWorkingDir: projectRoot,
  });

  const { seedData, call, state, resolveApiPath, resolveMockMode, isBackendAlive, probeBackend } =
    await import(pathToFileURL(bundleFile).href);
  await state.init({ seed: seedData });

  // Ожидания считаем из сида, а не хардкодом: public/mock/db.json регенерируется из
  // server/db.json (npm run seed:demo / build:demo), и число задач в нём меняется.
  const seedTasks = seedData.tasks.length;
  const pagesFor = (limit) => Math.ceil(seedTasks / limit);
  const lastPageItems = (limit) => (seedTasks % limit === 0 ? limit : seedTasks % limit);

  check('сид не пустой', seedTasks > 0, String(seedTasks));

  // 1. Пагинация
  const page1 = call('GET', '/tasks', { _page: 1, _limit: 5 });
  check(
    'GET /tasks страница 1: 5 элементов',
    page1.body.data.length === 5,
    JSON.stringify(page1.body.data.length),
  );
  check(
    `GET /tasks: total = ceil(${seedTasks}/5) = ${pagesFor(5)}`,
    page1.body.pageData.total === pagesFor(5),
    String(page1.body.pageData.total),
  );
  check(
    'GET /tasks: next=true, prev=false',
    page1.body.pageData.next === true && page1.body.pageData.prev === false,
  );

  const lastPage = call('GET', '/tasks', { _page: pagesFor(5), _limit: 5 });
  check(
    `GET /tasks последняя страница: ${lastPageItems(5)} элемента(ов)`,
    lastPage.body.data.length === lastPageItems(5),
    String(lastPage.body.data.length),
  );
  check(
    'GET /tasks: page>total clampится к total',
    call('GET', '/tasks', { _page: 99999, _limit: 5 }).body.pageData.page === pagesFor(5),
    String(call('GET', '/tasks', { _page: 99999, _limit: 5 }).body.pageData.page),
  );

  const firstId = page1.body.data[0].id;
  const byId = call('GET', `/tasks/${firstId}`);
  check(
    `GET /tasks/${firstId} возвращает эту задачу`,
    byId.status === 200 && byId.body.id === firstId,
  );
  check('GET /tasks/999999 -> 404', call('GET', '/tasks/999999').status === 404);

  // 2. Проекты/исполнители
  check('GET /projects', call('GET', '/projects').body.length === 2);
  check('GET /users', call('GET', '/users').body.length === 3);

  // 3. Фильтры: применяются на «сервере», как в routes.json
  const targetStatus = page1.body.data[0].status;
  const apply = call(
    'PUT',
    '/filters/apply',
    {},
    {
      statuses: [targetStatus],
      search: '',
      workType: [],
      assigneeId: [],
      sortBy: 'order',
      sortOrder: 'asc',
    },
  );
  check('PUT /filters/apply -> 200', apply.status === 200);
  const filtered = call('GET', '/tasks', { _limit: 100 });
  check(
    'GET /tasks учитывает фильтр по статусу',
    filtered.body.data.every((t) => t.status === targetStatus) &&
      filtered.body.pageData.totalEntries < 1003,
    String(filtered.body.pageData.totalEntries),
  );

  const searchApply = call(
    'PUT',
    '/filters/apply',
    {},
    { ...apply.body, statuses: [], search: 'a' },
  );
  check(
    'фильтр по search работает',
    searchApply.status === 200 &&
      call('GET', '/tasks', { _limit: 10 }).body.data.every((t) =>
        t.name.toLowerCase().includes('a'),
      ),
  );

  // id в db.json у части задач строковые, у части числовые — сервер сравнивает так же,
  // поэтому ожидаем не числовой порядок, а монотонность по компаратору сервера.
  const idCmp = (a, b) =>
    typeof a.id === 'string' && typeof b.id === 'string'
      ? String(a.id).localeCompare(String(b.id), 'ru')
      : Number(a.id) - Number(b.id);

  const sorted = call(
    'PUT',
    '/filters/apply',
    {},
    { ...apply.body, search: '', sortBy: 'id', sortOrder: 'asc' },
  );
  const idsAsc = call('GET', '/tasks', { _limit: 100 }).body.data;
  check(
    'сортировка по id asc (монотонность по компаратору сервера)',
    sorted.status === 200 && idsAsc.every((t, i, arr) => i === 0 || idCmp(arr[i - 1], t) <= 0),
    `ids: ${idsAsc
      .slice(0, 8)
      .map((t) => t.id)
      .join(',')}`,
  );

  const desc = call(
    'PUT',
    '/filters/apply',
    {},
    { ...apply.body, search: '', sortBy: 'id', sortOrder: 'desc' },
  );
  const idsDesc = call('GET', '/tasks', { _limit: 100 }).body.data;
  check(
    'сортировка по id desc',
    desc.status === 200 && idsDesc.every((t, i, arr) => i === 0 || idCmp(arr[i - 1], t) >= 0),
    `ids: ${idsDesc
      .slice(0, 8)
      .map((t) => t.id)
      .join(',')}`,
  );

  const orderSort = call(
    'PUT',
    '/filters/apply',
    {},
    { ...apply.body, search: '', sortBy: 'order', sortOrder: 'asc' },
  );
  const byOrder = call('GET', '/tasks', { _limit: 100 }).body.data;
  check(
    'числовая сортировка по order asc',
    orderSort.status === 200 &&
      byOrder.every((t, i, arr) => i === 0 || Number(arr[i - 1].order) <= Number(t.order)),
    `orders: ${byOrder
      .slice(0, 8)
      .map((t) => t.order)
      .join(',')}`,
  );

  call(
    'PUT',
    '/filters/apply',
    {},
    { statuses: [], search: '', workType: [], assigneeId: [], sortBy: 'order', sortOrder: 'asc' },
  );

  // 4. CRUD
  const created = call(
    'POST',
    '/tasks',
    {},
    { name: 'Новая задача', status: 'not_started', assignees: [], projectIds: [] },
  );
  check('POST /tasks -> 201 и id', created.status === 201 && typeof created.body.id === 'number');
  check(
    'список вырос на 1',
    call('GET', '/tasks', { _limit: 1 }).body.pageData.totalEntries === seedTasks + 1,
    String(call('GET', '/tasks', { _limit: 1 }).body.pageData.totalEntries),
  );

  const patched = call('PATCH', `/tasks/${created.body.id}`, {}, { status: 'in_progress' });
  check(
    'PATCH /tasks/:id меняет только status',
    patched.status === 200 &&
      patched.body.status === 'in_progress' &&
      patched.body.name === 'Новая задача',
  );

  const removed = call('DELETE', `/tasks/${created.body.id}`);
  check(
    'DELETE /tasks/:id -> массив без удалённой',
    removed.status === 200 &&
      Array.isArray(removed.body) &&
      !removed.body.some((t) => t.id === created.body.id),
  );

  const orderPatch = call('PATCH', '/tasks/order', {}, { orders: [{ id: firstId, order: 999 }] });
  check(
    'PATCH /tasks/order применяет дельту',
    orderPatch.status === 200 && call('GET', `/tasks/${firstId}`).body.order === 999,
  );
  check(
    'PATCH /tasks/order с пустым массивом -> 400',
    call('PATCH', '/tasks/order', {}, { orders: [] }).status === 400,
  );

  // 5. Неизвестный маршрут
  check('несуществующий маршрут -> 404', call('GET', '/unknown').status === 404);

  // 6. Разбор URL: api.ts ходит на '/api/...' (от корня домена), а Pages живёт на /<repo>/
  // Симулируем браузерное location, чтобы работал и проверкой origin.
  globalThis.location = {
    href: 'https://dgokokonda.github.io/quasar-task-manager/tasks',
    search: '?mock=on',
  };

  check(
    'resolveApiPath: /api/tasks при base /quasar-task-manager/',
    resolveApiPath('https://dgokokonda.github.io/api/tasks?_page=2', '/quasar-task-manager/') ===
      '/tasks',
    String(
      resolveApiPath('https://dgokokonda.github.io/api/tasks?_page=2', '/quasar-task-manager/'),
    ),
  );
  check(
    'resolveApiPath: /quasar-task-manager/api/tasks/12',
    resolveApiPath(
      'https://dgokokonda.github.io/quasar-task-manager/api/tasks/12',
      '/quasar-task-manager/',
    ) === '/tasks/12',
  );
  check(
    'resolveApiPath: относительный /api/tasks из api.ts',
    resolveApiPath('/api/tasks', '/quasar-task-manager/') === '/tasks',
  );
  check(
    'resolveApiPath: статику не перехватывать',
    resolveApiPath('/quasar-task-manager/assets/app.js', '/quasar-task-manager/') === null,
  );
  check(
    'resolveApiPath: чужой origin не перехватывать',
    resolveApiPath('https://api.example.com/tasks', '/') === null,
  );
  // 7. Режимы mock API: env/URL-переключатели и проверка живости бэкенда.
  //    Без этого npm run dev без npm run server даёт 500 на все /api/* (Vite proxy).
  check(
    '?mock=on поверх env=false → intercept',
    resolveMockMode({ queryValue: 'on', envValue: 'false' }) === 'intercept',
  );
  check(
    '?mock=off поверх env=true → off',
    resolveMockMode({ queryValue: 'off', envValue: 'true' }) === 'off',
  );
  check(
    '?mock=fallback → fallback',
    resolveMockMode({ queryValue: 'fallback', envValue: 'false' }) === 'fallback',
  );
  check(
    'VITE_MOCK_API=true → intercept',
    resolveMockMode({ queryValue: null, envValue: 'true' }) === 'intercept',
  );
  check(
    'VITE_MOCK_API=fallback (dev) → fallback',
    resolveMockMode({ queryValue: null, envValue: 'fallback' }) === 'fallback',
  );
  check('VITE_MOCK_API не задан → off', resolveMockMode({}) === 'off');

  const jsonReply = (status) => ({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
  });
  // Именно так Vite отвечает, когда target прокси недоступен: 500 + text/plain.
  const proxyReply = { ok: false, status: 500, headers: { get: () => 'text/plain' } };

  check('бэкенд жив: 200 application/json', isBackendAlive(jsonReply(200)) === true);
  check(
    'бэкенд жив: 500 application/json (ошибка самого сервера)',
    isBackendAlive(jsonReply(500)) === true,
  );
  check('бэкенд мёртв: 500 text/plain (ошибка прокси)', isBackendAlive(proxyReply) === false);
  check('probeBackend: живой бэкенд', (await probeBackend(async () => jsonReply(200))) === true);
  check('probeBackend: ошибка прокси', (await probeBackend(async () => proxyReply)) === false);
  check(
    'probeBackend: fetch бросает исключение',
    (await probeBackend(async () => {
      throw new Error('ECONNREFUSED');
    })) === false,
  );
  check(
    'probeBackend: зависший запрос прерывается по таймауту',
    (await probeBackend(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
      '/api/users',
      20,
    )) === false,
  );
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n[test:mock] провалено ${failures.length}: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\n[test:mock] все проверки пройдены');

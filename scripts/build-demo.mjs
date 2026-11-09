/**
 * Кроссплатформенная сборка демо для GitHub Pages (Windows/Linux/macOS):
 * задаёт publicPath и режим роутера, перегенерирует сид демо и вызывает `quasar build`,
 * затем кладёт копию index.html рядом как 404.html — это SPA-fallback для GitHub Pages
 * (иначе прямая ссылка на /tasks/124 отдаёт 404 от Pages).
 *
 * Переменные окружения:
 *   DEMO_BASE / GH_PAGES_BASE  публичный путь, по умолчанию '/quasar-task-manager/'
 *                              ('/' — для корневого домена: Netlify, Vercel, свой домен)
 *   ROUTER_MODE    'history' (default, работает через 404.html) или 'hash' (гарантированно)
 *
 * Запуск локально:  npm run build:demo
 * Запуск в CI:      см. .github/workflows/deploy-demo.yml
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const publicPath = process.env.DEMO_BASE ?? process.env.GH_PAGES_BASE ?? '/quasar-task-manager/';
const routerMode = process.env.ROUTER_MODE ?? 'history';

const env = {
  ...process.env,
  PUBLIC_PATH: publicPath,
  ROUTER_MODE: routerMode,
  // Прод-сборка всегда включает mock API (см. .env.production); дублируем на случай CI.
  VITE_MOCK_API: process.env.VITE_MOCK_API ?? 'true',
  NODE_ENV: 'production',
};

function run(command, args, label) {
  console.log(`\n[build:demo] ${label}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd: projectRoot, env, stdio: 'inherit' });

  if (result.error) {
    console.error('[build:demo] не удалось запустить процесс:', result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// 1. Свежий сид демо из server/db.json (без служебного pageData).
run(process.execPath, [join(projectRoot, 'scripts', 'generate-demo-seed.mjs')], 'seed');

// 2. Прод-сборка SPA (bin/quasar.js запускаем тем же node — не зависит от PATH/оболочки).
run(
  process.execPath,
  [join(projectRoot, 'node_modules', '@quasar', 'app-vite', 'bin', 'quasar.js'), 'build'],
  'build',
);

// 3. SPA-fallback для GitHub Pages: index.html отдаётся на несуществующие пути.
const spaDir = join(projectRoot, 'dist', 'spa');
const indexHtml = join(spaDir, 'index.html');
const notFoundHtml = join(spaDir, '404.html');

if (!existsSync(indexHtml)) {
  console.error(`[build:demo] не найден ${indexHtml} — сборка не удалась?`);
  process.exit(1);
}

copyFileSync(indexHtml, notFoundHtml);

console.log(`\n[build:demo] готово: ${spaDir}`);
console.log(
  `[build:demo] publicPath=${publicPath} routerMode=${routerMode} mockApi=${env.VITE_MOCK_API}`,
);
console.log('[build:demo] 404.html создан (SPA-fallback для GitHub Pages)');

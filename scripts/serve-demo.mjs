/**
 * Локальный предпросмотр собранного демо (dist/spa) без внешних зависимостей:
 * статика + SPA-fallback (как это сделают GitHub Pages / Netlify / Vercel).
 *
 * Запуск:  npm run preview:demo   (после npm run build:demo)
 * Адрес:   http://localhost:5000/quasar-task-manager/
 *
 * Переменные: PORT (5000), GH_PAGES_BASE (/quasar-task-manager/).
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const distDir = join(projectRoot, 'dist', 'spa');
const port = Number(process.env.PORT ?? 5000);
const rawBase = process.env.GH_PAGES_BASE ?? '/quasar-task-manager/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/** Путь запроса -> файл внутри dist (с защитой от ../). */
function resolveFile(pathname) {
  let path = decodeURIComponent(pathname.split('?')[0]);

  if (base !== '/' && (path === base || path === base.replace(/\/$/, ''))) path = '/';
  if (base !== '/' && path.startsWith(base)) path = `/${path.slice(base.length)}`;

  const relative = path.replace(/^\/+/, '');
  const candidate = join(distDir, relative);
  const normalised = resolve(candidate);

  if (normalised !== resolve(distDir) && !normalised.startsWith(resolve(distDir) + sep)) {
    return null; // выход за пределы dist
  }

  if (existsSync(normalised) && statSync(normalised).isDirectory()) {
    return resolve(join(normalised, 'index.html'));
  }
  return normalised;
}

const server = createServer((req, res) => {
  if (!existsSync(distDir)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Нет ${distDir}. Сначала выполните: npm run build:demo`);
    return;
  }

  const file = resolveFile(req.url ?? '/');
  const indexHtml = join(distDir, 'index.html');

  if (file && existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    createReadStream(file).pipe(res);
    return;
  }

  // SPA-fallback: всё, чего нет на диске, отдаём index.html (router сам разберётся).
  res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
  createReadStream(indexHtml).pipe(res);
});

server.listen(port, () => {
  console.log(`[preview:demo] http://localhost:${port}${base}`);
  console.log(`[preview:demo] отдаём ${distDir} (base=${base}, SPA-fallback включён)`);
  console.log('[preview:demo] сброс состояния демо: добавить ?resetDemo=1 к адресу');
});

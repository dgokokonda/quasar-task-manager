/**
 * Запускает дев-сервер Quasar и бэкенд (server/index.mjs) в одном терминале:
 * npm run dev + npm run server разом. Без бэкенда Vite-прокси отвечает 500 на /api/*,
 * поэтому для запуска «всего сразу» этот скрипт удобнее двух отдельных терминалов.
 *
 * Запуск: npm run dev:all
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quasarBin = join(projectRoot, 'node_modules', '@quasar', 'app-vite', 'bin', 'quasar.js');

const COLORS = { api: '\x1b[36m', web: '\x1b[35m', reset: '\x1b[0m' };
const children = [];
let shuttingDown = false;

function pipe(label, color, stream) {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) console.log(`${color}[${label}]${COLORS.reset} ${line}`);
  });
  stream.on('end', () => {
    if (buffer) console.log(`${color}[${label}]${COLORS.reset} ${buffer}`);
  });
}

function start(label, color, file, args) {
  if (!existsSync(file)) {
    console.error(`[${label}] не найден файл ${file} — сначала npm install`);
    process.exitCode = 1;
    return;
  }

  const child = spawn(process.execPath, [file, ...args], {
    cwd: projectRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.push(child);
  pipe(label, color, child.stdout);
  pipe(label, color, child.stderr);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.log(`[${label}] процесс завершился (code=${code} signal=${signal})`);
    shutdown(code ?? 0);
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  for (const child of children) {
    try {
      child.kill('SIGINT');
    } catch {
      // процесс уже завершился
    }
  }
  // Windows не всегда обрабатывает SIGINT у дочернего node — добиваем принудительно.
  setTimeout(() => {
    for (const child of children) {
      try {
        child.kill('SIGKILL');
      } catch {
        // уже мёртв
      }
    }
    process.exit(process.exitCode ?? 0);
  }, 2000).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('[dev:all] бэкенд: http://localhost:3000, веб: http://localhost:9000');
start('api', COLORS.api, join(projectRoot, 'server', 'index.mjs'), []);
start('web', COLORS.web, quasarBin, ['dev']);

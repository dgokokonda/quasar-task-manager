/**
 * Готовит сид для демо на статическом хостинге: public/mock/db.json.
 * Берёт server/db.json и убирает служебный ключ pageData (его пишет сервер при GET /tasks,
 * mock API считает пагинацию сам).
 *
 * Запуск: npm run seed:demo   (или npm run build:demo — он вызывает этот скрипт сам)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFile = join(projectRoot, 'server', 'db.json');
const targetFile = join(projectRoot, 'public', 'mock', 'db.json');

const db = JSON.parse(readFileSync(sourceFile, 'utf8'));
delete db.pageData;

mkdirSync(dirname(targetFile), { recursive: true });
writeFileSync(targetFile, `${JSON.stringify(db, null, 2)}\n`);

console.log(
  `[seed:demo] ${sourceFile} -> ${targetFile} ` +
    `(tasks: ${db.tasks.length}, projects: ${db.projects.length}, users: ${db.users.length})`,
);

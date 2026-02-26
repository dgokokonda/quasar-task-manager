/**
 * Кастомный json-server для task запросов
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { App } from '@tinyhttp/app';
import { json } from 'milliparsec';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { createApp } from 'json-server/lib/app.js';
import { Observer } from 'json-server/lib/observer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'db.json');

if (!existsSync(dbPath)) {
  console.error('db.json not found at', dbPath);
  process.exit(1);
}

const adapter = new JSONFile(dbPath);
const observer = new Observer(adapter);
const db = new Low(observer, {});
await db.read();

const port = Number(process.env.PORT) || 3000;
const jsonServerApp = createApp(db, { static: [] });

function pathname(req) {
  const u = req.url ?? req.originalUrl ?? '';
  return String(u).split('?')[0].replace(/^\/api/, '') || '/';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const app = new App();

// Убираем префикс /api из URL, чтобы json-server видел /tasks, а не /api/tasks.
app.use((req, res, next) => {
  const u = req.url ?? '';
  if (String(u).startsWith('/api')) {
    const rewritten = u.replace(/^\/api/, '') || '/';
    req.url = rewritten;
    req.originalUrl = rewritten;
  }
  next();
});

// GET /tasks — отдаём список из db сами (надёжно при любом порядке middleware).
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const path = pathname(req);
  if (path !== '/tasks') return next();
  const tasks = db.data?.tasks;
  if (!Array.isArray(tasks)) {
    return res.status(500).json({ error: 'tasks not array' });
  }
  const queryString = (req.url ?? '').split('?')[1] ?? '';
  const params = new URLSearchParams(queryString);
  const sort = params.get('_sort');
  const order = params.get('_order') || 'asc';
  let result = [...tasks];
  if (sort && typeof tasks[0]?.[sort] !== 'undefined') {
    const mult = order === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1 * mult;
      if (bVal == null) return -1 * mult;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * mult;
      return String(aVal).localeCompare(String(bVal), 'ru') * mult;
    });
  }
  return res.json(result);
});

// GET /tasks/:id — одна задача.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const path = pathname(req);
  const match = path.match(/^\/tasks\/(\d+)$/);
  if (!match) return next();
  const id = Number(match[1]);
  const tasks = db.data?.tasks;
  if (!Array.isArray(tasks)) {
    return res.status(500).json({ error: 'tasks not array' });
  }
  const task = tasks.find((t) => Number(t.id) === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json(task);
});

app.use(async (req, res, next) => {
  const path = pathname(req);
  const isPutTasks = req.method === 'PUT' && path === '/tasks';
  const isPatchOrder = req.method === 'PATCH' && path === '/tasks/order';
  const isPatchTask = req.method === 'PATCH' && /^\/tasks\/\d+$/.test(path);

  if (!isPutTasks && !isPatchOrder && !isPatchTask /*&& !isDeleteTask && !isPostTask*/) return next();

  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  if (isPutTasks) {
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Body must be an array' });
    }

    const normalized = body.map((t) => ({ ...t, id: Number(t.id) }));
    db.data.tasks = normalized;
    await db.write();
    return res.json(db.data.tasks);
  }

  if (isPatchOrder) {
    const orders = body?.orders;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Body must be { orders: [{ id, order }, ...] }' });
    }
    const tasks = db.data.tasks;
    if (!Array.isArray(tasks)) {
      return res.status(500).json({ error: 'tasks not array' });
    }
    const idToIndex = new Map(tasks.map((t, i) => [Number(t.id), i]));
    for (const { id, order } of orders) {
      const idx = idToIndex.get(Number(id));
      if (idx !== undefined && typeof order === 'number') {
        tasks[idx] = { ...tasks[idx], order };
      }
    }
    await db.write();
    return res.json({ ok: true });
  }

  if (isPatchTask) {
    const id = Number(path.split('/').pop());
    const tasks = db.data.tasks;
    if (!Array.isArray(tasks)) {
      return res.status(500).json({ error: 'tasks not array' });
    }

    const idx = tasks.findIndex((t) => Number(t.id) === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const updated = { ...tasks[idx], ...body, id };
    tasks[idx] = updated;
    await db.write();
    return res.json(updated);
  }

  // if (isDeleteTask) {
  //   const id = Number(path.split('/').pop());
  //   if (id === undefined) {
  //     return res.status(404).json({ error: 'Task not found' });
  //   }

  //   const updated = db.data.tasks.filter(t => +t.id !== id);
  //   db.data.tasks = updated;
  //   await db.write();
  //   return res.json(updated);

  // }

  // if (isPostTask) {
  //   const tasks = db.data.tasks;
  //   if (!Array.isArray(tasks)) {
  //     return res.status(500).json({ error: 'tasks not array' });
  //   }

  //   if (!body) {
  //     return res.status(500).json({ error: 'invalid data' });
  //   }

  //   const normalized = { ...body, id: Date.now(), order: db.data.tasks.length + 1 };
  //   db.data.tasks.push(normalized);
  //   await db.write();
  //   return res.json(normalized);
  // }

  next();
});

app.use(json());
app.use(jsonServerApp);

app.listen(port, () => {
  console.log(`JSON Server (custom) on http://localhost:${port}`);
  console.log('PUT /tasks (array) — replace list; PATCH /tasks/:id — update task');
});

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
  return (
    String(u)
      .split('?')[0]
      .replace(/^\/api/, '') || '/'
  );
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

const filteredTasks = (filters, tasks) => {
  let result = [...tasks];

  if (filters.statuses.length) {
    result = result.filter((task) => filters.statuses.includes(task.status));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter((task) => task.name.toLowerCase().includes(searchLower));
  }

  if (filters.workType.length) {
    result = result.filter((task) => filters.workType.includes(task.workType));
  }

  if (filters.assigneeId?.length) {
    const assignee = new Set(filters.assigneeId);
    result = result.filter((task) => task.assignees.some((t) => assignee.has(t)));
  }

  const fieldName = filters.sortBy;
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  if (result.length <= 1) return result;

  return [...result].sort((a, b) => {
    const aVal = a[fieldName];
    const bVal = b[fieldName];

    if (aVal == null) return 1 * sortOrder;
    if (bVal == null) return -1 * sortOrder;
    if (aVal == null && bVal == null) return 0;

    if (fieldName === 'startDate' || fieldName === 'endDate') {
      const aTime = new Date(aVal).getTime();
      const bTime = new Date(bVal).getTime();
      return (aTime - bTime) * sortOrder;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return String(aVal).localeCompare(String(bVal), 'ru') * sortOrder;
    }

    return (Number(aVal) - Number(bVal)) * sortOrder;
  });
};

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
app.use(async (req, res, next) => {
  if (req.method !== 'GET') return next();
  const path = pathname(req);

  if (path !== '/tasks') return next();
  const tasks = db.data?.tasks;
  const filters = db.data?.filters;
  if (!Array.isArray(tasks)) {
    return res.status(500).json({ error: 'tasks not array' });
  }
  const queryString = (req.url ?? '').split('?')[1] ?? '';
  const params = new URLSearchParams(queryString);

  const page = parseInt(params.get('_page') || '1', 10);
  const limit = parseInt(params.get('_limit') || '20', 10);
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(100, limit));

  const from = (validPage - 1) * validLimit;
  const to = from + validLimit;

  const result = filteredTasks(filters, tasks);
  const totalPages = Math.max(1, Math.ceil(result.length / validLimit));

  const currentPage = Math.min(validPage, totalPages);
  const adjustedFrom = (currentPage - 1) * validLimit;

  const pageData = {
    page: currentPage,
    limit: validLimit,
    next: currentPage < totalPages,
    prev: currentPage > 1,
    total: totalPages,
    totalEntries: result.length,
  };

  db.data.pageData = pageData;
  await db.write();
  return res.json({ data: result.slice(from, from + limit), pageData });
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
  const isDeleteTask = req.method === 'DELETE' && /^\/tasks\/\d+$/.test(path);
  const isPostTask = req.method === 'POST' && path === '/tasks';
  const isPutFilters = req.method === 'PUT' && path === '/filters/apply';

  if (!isPutTasks && !isPatchOrder && !isPatchTask && !isDeleteTask && !isPostTask && !isPutFilters)
    return next();

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

  if (isDeleteTask) {
    const id = Number(path.split('/').pop());
    if (id === undefined) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = db.data.tasks.filter((t) => +t.id !== id);
    db.data.tasks = updated;
    await db.write();
    return res.json(updated);
  }

  if (isPostTask) {
    const tasks = db.data.tasks;
    if (!Array.isArray(tasks)) {
      return res.status(500).json({ error: 'tasks not array' });
    }

    if (!body) {
      return res.status(500).json({ error: 'invalid data' });
    }

    const normalized = { ...body, id: Date.now(), order: db.data.tasks.length + 1 };
    db.data.tasks.push(normalized);
    await db.write();
    return res.json(normalized);
  }

  if (isPutFilters) {
    if (!body || !(body instanceof Object)) {
      return res.status(500).json({ error: 'invalid data' });
    }

    db.data.filters = { ...body };
    await db.write();
    return res.json(db.data.filters);
  }

  next();
});

app.use(json());
app.use(jsonServerApp);

app.listen(port, () => {
  console.log(`JSON Server (custom) on http://localhost:${port}`);
  // console.log('PUT /tasks (array) — replace list; PATCH /tasks/:id — update task');
});

/**
 * Маршруты и логика mock API. Повторяет server/index.mjs: те же маршруты
 * (/tasks, /tasks/:id, /tasks/order, /filters, /filters/apply, /projects, /users),
 * та же фильтрация/сортировка из db.filters, та же пагинация и дельта порядка.
 *
 * Отличия от сервера (сознательные, на поведение клиента не влияют):
 * - не пишется служебный ключ pageData (на сервере — запись в db.json при каждом GET);
 * - некорректные _page/_limit трактуются как значения по умолчанию, а не как NaN;
 * - страница всегда берётся с учётом clamp'а currentPage (сервер при page > total
 *   отдавал пустой data при корректном pageData).
 */
import type { Task, TaskFiltersType } from '../types';
import { DEFAULT_FILTERS, type MockDatabase } from './db';

export interface MockRequest {
  method: string;
  /** Путь без префикса /api: /tasks, /tasks/12, /filters/apply ... */
  path: string;
  searchParams: URLSearchParams;
  body: unknown;
  db: MockDatabase;
}

export interface MockReply {
  status: number;
  body: unknown;
  /** true — данные изменены, перехватчик сохранит состояние в localStorage. */
  mutated?: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const TASK_ID_RE = /^\/tasks\/(-?\d+)$/;

function notFound(path: string): MockReply {
  return { status: 404, body: { error: `Not found: ${path}` } };
}

function badRequest(message: string): MockReply {
  return { status: 400, body: { error: message } };
}

function fieldValue(task: Task, field: string): unknown {
  return (task as unknown as Record<string, unknown>)[field];
}

/** Приводит значение поля к числовой метке времени (ISO-строки, Date, timestamp). */
function toTime(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value);
  if (value instanceof Date) return value.getTime();
  return Number.NaN;
}

/** Копия серверной filteredTasks(): фильтры берутся из сохранённого db.filters. */
export function filterAndSortTasks(filters: TaskFiltersType, tasks: Task[]): Task[] {
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

  if (filters.assigneeId.length) {
    const assignees = new Set(filters.assigneeId);
    result = result.filter(
      (task) => Array.isArray(task.assignees) && task.assignees.some((t) => assignees.has(t)),
    );
  }

  const fieldName = filters.sortBy;
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  if (result.length <= 1) return result;

  return [...result].sort((a, b) => {
    const aVal = fieldValue(a, fieldName);
    const bVal = fieldValue(b, fieldName);

    if (aVal == null) return 1 * sortOrder;
    if (bVal == null) return -1 * sortOrder;

    if (fieldName === 'startDate' || fieldName === 'endDate') {
      return (toTime(aVal) - toTime(bVal)) * sortOrder;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal, 'ru') * sortOrder;
    }

    return (Number(aVal) - Number(bVal)) * sortOrder;
  });
}

function parseIntParam(params: URLSearchParams, key: string, fallback: number): number {
  const parsed = Number.parseInt(params.get(key) ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** GET /tasks — страница списка + метаданные пагинации (форма pageData как у сервера). */
function paginateTasks(db: MockDatabase, params: URLSearchParams): MockReply {
  const tasks = db.tasks;
  if (!Array.isArray(tasks)) {
    return { status: 500, body: { error: 'tasks not array' } };
  }

  const validPage = Math.max(DEFAULT_PAGE, parseIntParam(params, '_page', DEFAULT_PAGE));
  const validLimit = Math.max(
    1,
    Math.min(MAX_LIMIT, parseIntParam(params, '_limit', DEFAULT_LIMIT)),
  );

  const result = filterAndSortTasks(db.filters ?? DEFAULT_FILTERS, tasks);
  const totalPages = Math.max(1, Math.ceil(result.length / validLimit));
  const currentPage = Math.min(validPage, totalPages);
  const from = (currentPage - 1) * validLimit;

  const pageData = {
    page: currentPage,
    limit: validLimit,
    next: currentPage < totalPages,
    prev: currentPage > 1,
    total: totalPages,
    totalEntries: result.length,
  };

  return {
    status: 200,
    body: { data: result.slice(from, from + validLimit), pageData },
  };
}

/** Единая точка входа mock API: метод + путь (без /api) + query + тело. */
export function handleMockRequest({
  method,
  path,
  searchParams,
  body,
  db,
}: MockRequest): MockReply {
  const httpMethod = method.toUpperCase();

  // --- GET ---
  if (httpMethod === 'GET') {
    if (path === '/tasks') return paginateTasks(db, searchParams);

    const taskMatch = TASK_ID_RE.exec(path);
    if (taskMatch) {
      const id = Number(taskMatch[1]);
      const task = db.tasks.find((item) => Number(item.id) === id);
      return task
        ? { status: 200, body: task }
        : { status: 404, body: { error: 'Task not found' } };
    }

    if (path === '/filters') return { status: 200, body: db.filters ?? { ...DEFAULT_FILTERS } };
    if (path === '/projects') return { status: 200, body: db.projects };
    if (path === '/users') return { status: 200, body: db.users };

    return notFound(path);
  }

  // --- PUT /tasks (legacy: полная замена списка) ---
  if (httpMethod === 'PUT' && path === '/tasks') {
    if (!Array.isArray(body)) return badRequest('Body must be an array');

    db.tasks = (body as Record<string, unknown>[]).map(
      (task) => ({ ...task, id: Number(task.id) }) as Task,
    );

    return { status: 200, body: db.tasks, mutated: true };
  }

  // --- PATCH /tasks/order — дельта порядка после drag&drop ---
  if (httpMethod === 'PATCH' && path === '/tasks/order') {
    const orders = (body as { orders?: unknown } | null)?.orders;
    if (!Array.isArray(orders) || orders.length === 0) {
      return badRequest('Body must be { orders: [{ id, order }, ...] }');
    }

    const idToIndex = new Map(db.tasks.map((task, index) => [Number(task.id), index]));
    for (const item of orders as { id?: unknown; order?: unknown }[]) {
      const index = idToIndex.get(Number(item?.id));
      if (index === undefined || typeof item?.order !== 'number') continue;

      const current = db.tasks[index];
      if (!current) continue;

      db.tasks[index] = { ...current, order: item.order };
    }

    return { status: 200, body: { ok: true }, mutated: true };
  }

  // --- PATCH /tasks/:id — частичное обновление (минимальный payload) ---
  if (httpMethod === 'PATCH' && TASK_ID_RE.test(path)) {
    const id = Number(TASK_ID_RE.exec(path)?.[1]);
    const index = db.tasks.findIndex((task) => Number(task.id) === id);
    const current = index !== -1 ? db.tasks[index] : undefined;

    if (!current) return { status: 404, body: { error: 'Task not found' } };

    const updated = { ...current, ...(body as Partial<Task>), id } as Task;
    db.tasks[index] = updated;

    return { status: 200, body: updated, mutated: true };
  }

  // --- DELETE /tasks/:id (как на сервере: ответ — обновлённый список целиком) ---
  if (httpMethod === 'DELETE' && TASK_ID_RE.test(path)) {
    const id = Number(TASK_ID_RE.exec(path)?.[1]);
    db.tasks = db.tasks.filter((task) => Number(task.id) !== id);

    return { status: 200, body: db.tasks, mutated: true };
  }

  // --- POST /tasks ---
  if (httpMethod === 'POST' && path === '/tasks') {
    if (typeof body !== 'object' || body === null) {
      return { status: 500, body: { error: 'invalid data' } };
    }

    const created = {
      ...(body as Record<string, unknown>),
      id: Date.now(),
      order: db.tasks.length + 1,
    } as Task;

    db.tasks.push(created);

    return { status: 201, body: created, mutated: true };
  }

  // --- PUT /filters/apply — фильтры хранятся на «сервере» и влияют на GET /tasks ---
  if (httpMethod === 'PUT' && path === '/filters/apply') {
    if (typeof body !== 'object' || body === null) {
      return { status: 500, body: { error: 'invalid data' } };
    }

    db.filters = body as TaskFiltersType;

    return { status: 200, body: db.filters, mutated: true };
  }

  return notFound(path);
}

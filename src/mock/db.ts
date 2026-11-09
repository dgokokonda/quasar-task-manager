/**
 * Хранилище данных для mock API (демо на статическом хостинге: GitHub Pages и т.п.).
 *
 * Сид — public/mock/db.json (это копия server/db.json без служебного ключа pageData).
 * Все изменения (CRUD, drag&drop порядок, фильтры) сохраняются в localStorage браузера,
 * поэтому состояние демо живёт между перезагрузками страницы и между визитами.
 *
 * Сброс демо: открыть страницу с ?resetDemo=1 (см. src/boot/mock-api.ts).
 */
import type { Project, Task, TaskFiltersType, User } from '../types';

export interface MockDatabase {
  tasks: Task[];
  projects: Project[];
  users: User[];
  filters: TaskFiltersType;
}

interface StoredState {
  version: number;
  savedAt: string;
  db: MockDatabase;
}

export interface InitMockDbOptions {
  /** Готовый сид (объект). Если не передан — сид грузится fetch'ом из seedUrl. */
  seed?: unknown;
  /** URL сида относительно origin, например /quasar-task-manager/mock/db.json */
  seedUrl?: string;
  /** Перечитать состояние из localStorage, даже если БД уже загружена в память. */
  force?: boolean;
}

export const DEMO_STORAGE_KEY = 'ppm-demo-db';
export const DEMO_SEED_VERSION = 1;
export const DEMO_SEED_FILE = 'mock/db.json';
const PERSIST_DEBOUNCE_MS = 300;

export const DEFAULT_FILTERS: TaskFiltersType = {
  statuses: [],
  search: '',
  workType: [],
  assigneeId: [],
  sortBy: 'order',
  sortOrder: 'asc',
};

let database: MockDatabase | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let storageWarningShown = false;

/** localStorage может быть недоступен (приватный режим, не браузер) — работаем в памяти. */
function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isFiltersLike(value: unknown): value is TaskFiltersType {
  return typeof value === 'object' && value !== null && 'sortBy' in value && 'sortOrder' in value;
}

/** Приводит произвольный JSON к форме MockDatabase (лишние ключи вроде pageData отбрасываются). */
export function normalizeDb(raw: unknown): MockDatabase {
  const source = (raw ?? {}) as Partial<Record<keyof MockDatabase, unknown>>;

  return {
    tasks: Array.isArray(source.tasks) ? (source.tasks as Task[]) : [],
    projects: Array.isArray(source.projects) ? (source.projects as Project[]) : [],
    users: Array.isArray(source.users) ? (source.users as User[]) : [],
    filters: isFiltersLike(source.filters) ? source.filters : { ...DEFAULT_FILTERS },
  };
}

function readStored(): MockDatabase | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as unknown;
    if (typeof state !== 'object' || state === null) return null;

    const parsed = state as Partial<StoredState>;
    // Сид версии N+1 всегда важнее сохранённого состояния версии N.
    if (parsed.version !== DEMO_SEED_VERSION || !parsed.db) return null;

    return normalizeDb(parsed.db);
  } catch {
    return null;
  }
}

function writeStored(db: MockDatabase): void {
  const storage = getStorage();
  if (!storage) return;

  const state: StoredState = {
    version: DEMO_SEED_VERSION,
    savedAt: new Date().toISOString(),
    db,
  };

  try {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Квота исчерпана или доступ запрещён — демо продолжает работать без сохранения.
    if (!storageWarningShown) {
      storageWarningShown = true;
      console.warn('[mock-api] состояние демо не сохраняется в localStorage:', err);
    }
  }
}

/**
 * Загружает состояние демо: сначала из localStorage, иначе из сида.
 * Должно быть выполнено ДО установки перехватчика fetch (или сид грузится реальным fetch'ом).
 */
export async function initMockDb(options: InitMockDbOptions = {}): Promise<MockDatabase> {
  if (database && !options.force) return database;

  const restored = readStored();
  if (restored) {
    database = restored;
    return database;
  }

  let seed: unknown = options.seed;
  if (seed === undefined) {
    const url = options.seedUrl ?? DEMO_SEED_FILE;
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`[mock-api] не удалось загрузить сид «${url}»: HTTP ${response.status}`);
    }
    seed = await response.json();
  }

  database = normalizeDb(seed);
  writeStored(database);
  return database;
}

export function getDb(): MockDatabase {
  if (!database) throw new Error('[mock-api] хранилище демо не инициализировано');
  return database;
}

export function isMockDbReady(): boolean {
  return database !== null;
}

/** Отложенное сохранение — вызывается после каждой мутации (POST/PATCH/PUT/DELETE). */
export function persistDb(): void {
  if (!database) return;

  if (persistTimer !== null) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (database) writeStored(database);
  }, PERSIST_DEBOUNCE_MS);
}

/** Немедленное сохранение (перед выгрузкой страницы). */
export function flushDb(): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (database) writeStored(database);
}

/** Удаляет сохранённое состояние и заново грузит сид. */
export async function resetMockDb(options: InitMockDbOptions = {}): Promise<MockDatabase> {
  const storage = getStorage();
  try {
    storage?.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // игнорируем: дальше initMockDb перезапишет состояние сидом
  }

  database = null;
  return initMockDb({ ...options, force: true });
}

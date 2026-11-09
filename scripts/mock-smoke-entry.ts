/**
 * Точка входа для смоук-теста mock API (scripts/smoke-mock.mjs).
 * Нужна, чтобы esbuild собрал mock-модули в один бандл с сидом внутри.
 */
import seed from '../public/mock/db.json';
import { getDb, initMockDb } from '../src/mock/db';
import { handleMockRequest, type MockReply } from '../src/mock/handlers';

export const seedData: unknown = seed;

export const state = {
  init: (options: { seed: unknown }) => initMockDb(options),
};

export function call(
  method: string,
  path: string,
  query: Record<string, string | number> = {},
  body: unknown = undefined,
): MockReply {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) searchParams.set(key, String(value));

  return handleMockRequest({ method, path, searchParams, body, db: getDb() });
}

export { resolveApiPath } from '../src/mock/fetchInterceptor';
export { isBackendAlive, probeBackend, resolveMockMode } from '../src/mock/mode';

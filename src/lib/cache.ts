// In-memory TTL cache. Shared across route handlers within one server process.
// Phase 2.5 swap-in: Upstash Redis with the same get/set/wrap interface.

type Entry<T> = { value: T; expiresAt: number };

const globalCache = global as unknown as { _kmCache?: Map<string, Entry<unknown>> };
const store: Map<string, Entry<unknown>> = globalCache._kmCache ?? new Map();
globalCache._kmCache = store;

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fetcher();
  cacheSet(key, value, ttlSeconds);
  return value;
}

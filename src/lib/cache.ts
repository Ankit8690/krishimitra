// Shared cache layer. Two backends behind one API:
//   - Upstash Redis (when UPSTASH_REDIS_REST_URL + _TOKEN are set)
//   - In-memory Map fallback (for local dev without Upstash creds)
// Vercel serverless functions spin up fresh isolates on cold start, so an
// in-memory cache misses across every invocation. Redis makes the cache
// survive so the weather/mandi/geocode round-trips stay rare.

import { Redis } from "@upstash/redis";

const KEY_PREFIX = "km:";

// Defensive init — a malformed UPSTASH_REDIS_REST_URL (missing https://,
// trailing whitespace, quoted string, etc.) makes `new Redis(...)` throw
// synchronously, which would crash Vercel's build during page-data
// collection. Swallow the error and log — we fall back to the in-memory
// cache and log the mode so it's obvious in the admin health chip.
function initRedis(): Redis | null {
  const raw = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!raw || !token) return null;
  const url = raw.trim().replace(/^["']|["']$/g, "");
  if (!/^https?:\/\//i.test(url)) {
    console.warn(`[cache] UPSTASH_REDIS_REST_URL is missing https:// prefix — falling back to memory cache. Got: ${url.slice(0, 40)}…`);
    return null;
  }
  try {
    return new Redis({ url, token: token.trim() });
  } catch (err) {
    console.warn("[cache] Redis init failed — falling back to memory cache:", err);
    return null;
  }
}
const redis = initRedis();

type Entry<T> = { value: T; expiresAt: number };
const globalCache = global as unknown as { _kmCache?: Map<string, Entry<unknown>> };
const store: Map<string, Entry<unknown>> = globalCache._kmCache ?? new Map();
globalCache._kmCache = store;

export function cacheMode(): "redis" | "memory" {
  return redis ? "redis" : "memory";
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const v = await redis.get<T>(KEY_PREFIX + key);
      return v ?? null;
    } catch (err) {
      // Redis outage should never break the app — fall through to a fresh fetch
      console.warn("[cache] redis get failed", err);
      return null;
    }
  }
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (redis) {
    try {
      await redis.set(KEY_PREFIX + key, value, { ex: ttlSeconds });
    } catch (err) {
      console.warn("[cache] redis set failed", err);
    }
    return;
  }
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

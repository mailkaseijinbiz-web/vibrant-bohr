import Redis from 'ioredis';

// Shared persistence helper for the serverless API routes.
//
// Storage backend resolution:
//   1. REDIS_URL            -> Redis (TCP, via ioredis) — the connected Vercel store
//   2. KV_REST_API_URL      -> Vercel KV / Upstash REST (handled by callers via @vercel/kv)
//   3. neither              -> callers fall back to paste.rs
//
// The Redis client is created lazily and cached at module scope so warm
// serverless invocations reuse a single connection instead of opening a new
// one per request.

let client = null;

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
    client.on('error', (err) => console.error('Redis connection error:', err.message));
  }
  return client;
}

// Values are JSON-encoded so objects/arrays round-trip cleanly. Plain strings
// (e.g. base64 image data) round-trip too: a JSON-encoded string parses back to
// the same string.
export async function storeGet(key) {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function storeSet(key, value) {
  const redis = getRedis();
  if (!redis) return false;
  await redis.set(key, JSON.stringify(value));
  return true;
}

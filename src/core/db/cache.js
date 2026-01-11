const cache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000;

export function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl
  });
}

export function del(key) {
  cache.delete(key);
}

export function clear() {
  cache.clear();
}

export function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}

export function getStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

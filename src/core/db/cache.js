/**
 * Cache simple en memoria para queries frecuentes
 * TODO: En FASE 3, esto será reemplazado por Redis
 * 
 * Por ahora, es un cache básico para optimizar queries comunes como getSettings
 */

/**
 * Cache en memoria (Map)
 * Estructura: key -> { value, timestamp, ttl }
 */
const cache = new Map();

/**
 * TTL por defecto en milisegundos (5 minutos)
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Obtiene un valor del cache
 * @param {string} key - Clave del cache
 * @returns {*|null} Valor cacheado o null si no existe o expiró
 */
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

/**
 * Guarda un valor en el cache
 * @param {string} key - Clave del cache
 * @param {*} value - Valor a cachear
 * @param {number} ttl - TTL en milisegundos (default: 5 minutos)
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Elimina una entrada del cache
 * @param {string} key - Clave a eliminar
 */
export function del(key) {
  cache.delete(key);
}

/**
 * Limpia todo el cache
 */
export function clear() {
  cache.clear();
}

/**
 * Elimina entradas expiradas del cache
 * Útil para llamar periódicamente y limpiar memoria
 */
export function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Obtiene estadísticas del cache
 * @returns {Object} Stats del cache
 */
export function getStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

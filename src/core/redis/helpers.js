/**
 * Helpers básicos para operaciones Redis con fallback seguro
 * Todas las funciones manejan el caso donde Redis no está disponible
 */
import { isRedisAvailable, getRedisClient } from "./client.js";
import { log } from "../logger/index.js";

/**
 * Obtiene un valor de Redis
 * @param {string} key
 * @returns {Promise<string|null>} El valor o null si no existe o Redis no está disponible
 */
export async function get(key) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value;
  } catch (error) {
    log.error("Redis", `Error al obtener key "${key}": ${error.message}`);
    return null;
  }
}

/**
 * Establece un valor en Redis con TTL opcional
 * @param {string} key
 * @param {string} value
 * @param {number} [ttlSeconds] TTL en segundos (opcional)
 * @returns {Promise<boolean>} true si se guardó correctamente, false en caso contrario
 */
export async function set(key, value, ttlSeconds = null) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    if (ttlSeconds && ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    log.error("Redis", `Error al establecer key "${key}": ${error.message}`);
    return false;
  }
}

/**
 * Elimina una o más keys de Redis
 * @param {string|string[]} keys
 * @returns {Promise<number>} Número de keys eliminadas (0 si Redis no está disponible)
 */
export async function del(keys) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const client = getRedisClient();
    const result = await client.del(Array.isArray(keys) ? keys : [keys]);
    return result;
  } catch (error) {
    log.error("Redis", `Error al eliminar keys: ${error.message}`);
    return 0;
  }
}

/**
 * Verifica si una key existe en Redis
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function exists(key) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    log.error("Redis", `Error al verificar existencia de key "${key}": ${error.message}`);
    return false;
  }
}

/**
 * Obtiene el TTL restante de una key
 * @param {string} key
 * @returns {Promise<number>} TTL en segundos, -1 si no tiene TTL, -2 si no existe, 0 si Redis no está disponible
 */
export async function ttl(key) {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const client = getRedisClient();
    return await client.ttl(key);
  } catch (error) {
    log.error("Redis", `Error al obtener TTL de key "${key}": ${error.message}`);
    return 0;
  }
}

/**
 * Establece el TTL de una key existente
 * @param {string} key
 * @param {number} seconds
 * @returns {Promise<boolean>}
 */
export async function expire(key, seconds) {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const result = await client.expire(key, seconds);
    return result === 1;
  } catch (error) {
    log.error("Redis", `Error al establecer TTL de key "${key}": ${error.message}`);
    return false;
  }
}

/**
 * Incrementa un contador atómico
 * @param {string} key
 * @param {number} [increment=1]
 * @returns {Promise<number|null>} Nuevo valor o null si Redis no está disponible
 */
export async function incr(key, increment = 1) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const client = getRedisClient();
    if (increment === 1) {
      return await client.incr(key);
    } else {
      return await client.incrby(key, increment);
    }
  } catch (error) {
    log.error("Redis", `Error al incrementar key "${key}": ${error.message}`);
    return null;
  }
}

/**
 * Obtiene y establece un valor (operación atómica)
 * @param {string} key
 * @param {string} value
 * @returns {Promise<string|null>} Valor anterior o null
 */
export async function getSet(key, value) {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const client = getRedisClient();
    return await client.getset(key, value);
  } catch (error) {
    log.error("Redis", `Error en getSet para key "${key}": ${error.message}`);
    return null;
  }
}

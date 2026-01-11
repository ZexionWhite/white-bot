import { isRedisAvailable, getRedisClient } from "./client.js";
import { log } from "../logger/index.js";

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

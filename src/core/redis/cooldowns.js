/**
 * Sistema de cooldowns usando Redis
 * Fallback seguro a PostgreSQL si Redis no está disponible
 */
import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { getCooldown as getCooldownQuery, setCooldown as setCooldownQuery } from "../../db.js";
import { log } from "../logger/index.js";

/**
 * Key pattern para cooldowns en Redis
 * @param {string} guildId
 * @param {string} userId
 * @param {string} event
 * @returns {string}
 */
function cooldownKey(guildId, userId, event) {
  return `capy:cooldown:${guildId}:${userId}:${event}`;
}

/**
 * Obtiene el timestamp del último cooldown
 * @param {string} guildId
 * @param {string} userId
 * @param {string} event
 * @returns {Promise<number|null>} Timestamp en ms o null si no existe
 */
export async function getCooldown(guildId, userId, event) {
  const key = cooldownKey(guildId, userId, event);
  
  // Intentar Redis primero
  if (isRedisAvailable()) {
    try {
      const cached = await get(key);
      if (cached) {
        const timestamp = parseInt(cached, 10);
        if (!isNaN(timestamp)) {
          return timestamp;
        }
      }
    } catch (error) {
      // Fallback a PostgreSQL en caso de error
      log.debug("Redis", `Error al obtener cooldown de Redis, usando PostgreSQL: ${error.message}`);
    }
  }

  // Fallback a PostgreSQL
  try {
    const result = await getCooldownQuery.get(guildId, userId, event);
    if (result && typeof result === 'object' && 'last_ts' in result) {
      return result.last_ts;
    }
    return null;
  } catch (error) {
    log.error("Cooldowns", `Error al obtener cooldown de PostgreSQL: ${error.message}`);
    return null;
  }
}

/**
 * Establece un cooldown
 * @param {string} guildId
 * @param {string} userId
 * @param {string} event
 * @param {number} timestamp Timestamp en ms
 * @param {number} ttlSeconds TTL opcional en segundos (si no se especifica, no expira en Redis)
 * @returns {Promise<void>}
 */
export async function setCooldown(guildId, userId, event, timestamp, ttlSeconds = null) {
  const key = cooldownKey(guildId, userId, event);
  const value = timestamp.toString();

  // Guardar en PostgreSQL (source of truth)
  try {
    await setCooldownQuery.run(guildId, userId, event, timestamp);
  } catch (error) {
    log.error("Cooldowns", `Error al guardar cooldown en PostgreSQL: ${error.message}`);
    // Continuar para intentar guardar en Redis también
  }

  // Guardar en Redis con TTL si está disponible
  if (isRedisAvailable()) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await set(key, value, ttlSeconds);
      } else {
        // Sin TTL: el cooldown persiste hasta que se elimine manualmente o expire por limpieza
        await set(key, value);
      }
    } catch (error) {
      // No crítico: PostgreSQL ya guardó el dato
      log.debug("Redis", `Error al guardar cooldown en Redis: ${error.message}`);
    }
  }
}

/**
 * Elimina un cooldown
 * @param {string} guildId
 * @param {string} userId
 * @param {string} event
 * @returns {Promise<void>}
 */
export async function deleteCooldown(guildId, userId, event) {
  const key = cooldownKey(guildId, userId, event);

  // Eliminar de Redis
  if (isRedisAvailable()) {
    try {
      await del(key);
    } catch (error) {
      log.debug("Redis", `Error al eliminar cooldown de Redis: ${error.message}`);
    }
  }

  // PostgreSQL no tiene DELETE para cooldowns (se sobrescriben con setCooldown)
  // Así que no necesitamos hacer nada aquí
}

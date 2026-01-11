import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { getCooldown as getCooldownQuery, setCooldown as setCooldownQuery } from "../../db.js";
import { log } from "../logger/index.js";

function cooldownKey(guildId, userId, event) {
  return `capy:cooldown:${guildId}:${userId}:${event}`;
}

export async function getCooldown(guildId, userId, event) {
  const key = cooldownKey(guildId, userId, event);

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
      
      log.debug("Redis", `Error al obtener cooldown de Redis, usando PostgreSQL: ${error.message}`);
    }
  }

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

export async function setCooldown(guildId, userId, event, timestamp, ttlSeconds = null) {
  const key = cooldownKey(guildId, userId, event);
  const value = timestamp.toString();

  try {
    await setCooldownQuery.run(guildId, userId, event, timestamp);
  } catch (error) {
    log.error("Cooldowns", `Error al guardar cooldown en PostgreSQL: ${error.message}`);
    
  }

  if (isRedisAvailable()) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await set(key, value, ttlSeconds);
      } else {
        
        await set(key, value);
      }
    } catch (error) {
      
      log.debug("Redis", `Error al guardar cooldown en Redis: ${error.message}`);
    }
  }
}

export async function deleteCooldown(guildId, userId, event) {
  const key = cooldownKey(guildId, userId, event);

  if (isRedisAvailable()) {
    try {
      await del(key);
    } catch (error) {
      log.debug("Redis", `Error al eliminar cooldown de Redis: ${error.message}`);
    }
  }

}

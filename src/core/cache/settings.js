/**
 * Cache wrapper para settings de guild
 * Implementa cache-aside: Redis -> PostgreSQL -> Cache
 */
import { getCachedSettings, invalidateSettingsCache } from "../redis/cache.js";
import { getSettings as getSettingsQuery } from "../../db.js";

/**
 * Obtiene settings de un guild con cache
 * @param {string} guildId
 * @returns {Promise<object|null>}
 */
export async function getSettings(guildId) {
  return getCachedSettings(guildId, async () => {
    const result = await getSettingsQuery.get(guildId);
    return result || null;
  });
}

/**
 * Invalida el cache de settings después de una actualización
 * @param {string} guildId
 */
export async function invalidateCache(guildId) {
  await invalidateSettingsCache(guildId);
}

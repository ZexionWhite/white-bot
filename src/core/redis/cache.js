/**
 * Sistema de cache para datos frecuentemente accedidos
 * Implementa estrategia cache-aside con fallback seguro a PostgreSQL
 */
import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";

/**
 * Constantes de TTL (Time To Live) en segundos
 */
export const TTL = {
  GUILD_SETTINGS: 300,      // 5 minutos - settings cambian poco
  COLOR_ROLES: 180,         // 3 minutos - roles cambian ocasionalmente
  COOLDOWN: 0,              // No usar cache para cooldowns (se manejan en Redis directamente)
  USER_STATS: 120,          // 2 minutos - stats cambian frecuentemente pero no crítico
  MOD_CASES: 60,            // 1 minuto - casos recientes
  BLACKLIST: 180,           // 3 minutos - blacklist activa
  PERMISSIONS: 120,         // 2 minutos - permisos/roles
};

/**
 * Keys de Redis - Namespace: capy:cache:<tipo>:<id>
 */
export const KEYS = {
  guildSettings: (guildId) => `capy:cache:settings:${guildId}`,
  colorRoles: (guildId) => `capy:cache:color_roles:${guildId}`,
  userStats: (guildId, userId) => `capy:cache:stats:${guildId}:${userId}`,
  modCases: (guildId, userId, type) => `capy:cache:cases:${guildId}:${userId}:${type || "all"}`,
  blacklist: (guildId, userId) => `capy:cache:blacklist:${guildId}:${userId}`,
};

/**
 * Obtiene settings de un guild con cache-aside
 * @param {string} guildId
 * @param {Function} dbFetch - Función async que obtiene settings desde PostgreSQL
 * @returns {Promise<object|null>}
 */
export async function getCachedSettings(guildId, dbFetch) {
  const cacheKey = KEYS.guildSettings(guildId);
  
  // Intentar obtener de cache
  if (isRedisAvailable()) {
    try {
      const cached = await get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          // Si el JSON es inválido, eliminar del cache y continuar
          await del(cacheKey);
        }
      }
    } catch (error) {
      // Error de Redis: continuar sin cache (fallback seguro)
    }
  }

  // Cache miss o Redis no disponible: obtener de PostgreSQL
  const settings = await dbFetch();
  
  // Guardar en cache (no bloquea si falla)
  if (settings && isRedisAvailable()) {
    try {
      await set(cacheKey, JSON.stringify(settings), TTL.GUILD_SETTINGS);
    } catch (error) {
      // Ignorar errores de cache: no es crítico
    }
  }

  return settings;
}

/**
 * Invalida el cache de settings de un guild
 * @param {string} guildId
 */
export async function invalidateSettingsCache(guildId) {
  const cacheKey = KEYS.guildSettings(guildId);
  await del(cacheKey);
}

/**
 * Invalida múltiples caches relacionados con un guild
 * @param {string} guildId
 * @param {string[]} types - Tipos de cache a invalidar (ej: ["settings", "color_roles"])
 */
export async function invalidateGuildCache(guildId, types = ["settings"]) {
  if (!isRedisAvailable()) {
    return;
  }

  const keysToDelete = [];
  
  for (const type of types) {
    switch (type) {
      case "settings":
        keysToDelete.push(KEYS.guildSettings(guildId));
        break;
      case "color_roles":
        keysToDelete.push(KEYS.colorRoles(guildId));
        break;
      // Se pueden agregar más tipos aquí
    }
  }

  if (keysToDelete.length > 0) {
    await del(keysToDelete);
  }
}

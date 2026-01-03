/**
 * Cache extendido para más tipos de datos
 * Color roles, blacklist, user stats, etc.
 */
import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

/**
 * TTL para diferentes tipos de cache
 */
export const EXTENDED_TTL = {
  COLOR_ROLES: 180,      // 3 minutos
  USER_STATS: 120,       // 2 minutos
  BLACKLIST_ENTRY: 300,  // 5 minutos - entradas individuales
  BLACKLIST_ALL: 180,    // 3 minutos - lista completa de un usuario
  MOD_CASES: 60,         // 1 minuto - casos recientes
};

/**
 * Keys para cache extendido
 */
export const EXTENDED_KEYS = {
  colorRoles: (guildId) => `capy:cache:color_roles:${guildId}`,
  userStats: (guildId, userId) => `capy:cache:user_stats:${guildId}:${userId}`,
  blacklistEntry: (guildId, userId) => `capy:cache:blacklist:${guildId}:${userId}`,
  blacklistAll: (guildId, userId) => `capy:cache:blacklist_all:${guildId}:${userId}`,
  modCases: (guildId, userId, type) => `capy:cache:mod_cases:${guildId}:${userId}:${type || "all"}`,
};

/**
 * Cache-aside genérico para cualquier dato
 * @param {string} key - Redis key
 * @param {Function} dbFetch - Función async que obtiene datos desde PostgreSQL
 * @param {number} ttlSeconds - TTL en segundos
 * @returns {Promise<any>}
 */
async function getCached(key, dbFetch, ttlSeconds) {
  // Intentar obtener de cache
  if (isRedisAvailable()) {
    try {
      const cached = await get(key);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          // JSON inválido: eliminar y continuar
          await del(key);
        }
      }
    } catch (error) {
      // Error de Redis: continuar sin cache
    }
  }

  // Cache miss: obtener de PostgreSQL
  const data = await dbFetch();
  
  // Guardar en cache
  if (data && isRedisAvailable()) {
    try {
      await set(key, JSON.stringify(data), ttlSeconds);
    } catch (error) {
      // No crítico
    }
  }

  return data;
}

/**
 * Obtiene color roles con cache
 * @param {string} guildId
 * @param {Function} dbFetch - Función async que obtiene color roles desde PostgreSQL
 * @returns {Promise<Array>}
 */
export async function getCachedColorRoles(guildId, dbFetch) {
  const key = EXTENDED_KEYS.colorRoles(guildId);
  return await getCached(key, dbFetch, EXTENDED_TTL.COLOR_ROLES) || [];
}

/**
 * Invalida cache de color roles
 * @param {string} guildId
 */
export async function invalidateColorRolesCache(guildId) {
  const key = EXTENDED_KEYS.colorRoles(guildId);
  await del(key);
}

/**
 * Obtiene user stats con cache
 * @param {string} guildId
 * @param {string} userId
 * @param {Function} dbFetch - Función async que obtiene stats desde PostgreSQL
 * @returns {Promise<object|null>}
 */
export async function getCachedUserStats(guildId, userId, dbFetch) {
  const key = EXTENDED_KEYS.userStats(guildId, userId);
  return await getCached(key, dbFetch, EXTENDED_TTL.USER_STATS);
}

/**
 * Invalida cache de user stats
 * @param {string} guildId
 * @param {string} userId
 */
export async function invalidateUserStatsCache(guildId, userId) {
  const key = EXTENDED_KEYS.userStats(guildId, userId);
  await del(key);
}

/**
 * Obtiene blacklist entries con cache
 * @param {string} guildId
 * @param {string} userId
 * @param {Function} dbFetch - Función async que obtiene blacklist desde PostgreSQL
 * @returns {Promise<Array>}
 */
export async function getCachedBlacklist(guildId, userId, dbFetch) {
  const key = EXTENDED_KEYS.blacklistAll(guildId, userId);
  return await getCached(key, dbFetch, EXTENDED_TTL.BLACKLIST_ALL) || [];
}

/**
 * Invalida cache de blacklist para un usuario
 * @param {string} guildId
 * @param {string} userId
 */
export async function invalidateBlacklistCache(guildId, userId) {
  const key = EXTENDED_KEYS.blacklistAll(guildId, userId);
  await del(key);
}

/**
 * Invalida todo el cache de blacklist de un guild
 * @param {string} guildId
 */
export async function invalidateBlacklistCacheGuild(guildId) {
  // Nota: En Redis no podemos hacer pattern matching fácilmente sin SCAN
  // Por ahora, invalidamos solo cuando sabemos el userId
  // Para invalidar todo, sería necesario hacer un SCAN, pero es costoso
  // Mejor invalidar específicamente cuando se crea/actualiza/elimina una entrada
}

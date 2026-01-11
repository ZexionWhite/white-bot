import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

export const EXTENDED_TTL = {
  COLOR_ROLES: 180,      
  USER_STATS: 120,       
  BLACKLIST_ENTRY: 300,  
  BLACKLIST_ALL: 180,    
  MOD_CASES: 60,         
};

export const EXTENDED_KEYS = {
  colorRoles: (guildId) => `capy:cache:color_roles:${guildId}`,
  userStats: (guildId, userId) => `capy:cache:user_stats:${guildId}:${userId}`,
  blacklistEntry: (guildId, userId) => `capy:cache:blacklist:${guildId}:${userId}`,
  blacklistAll: (guildId, userId) => `capy:cache:blacklist_all:${guildId}:${userId}`,
  modCases: (guildId, userId, type) => `capy:cache:mod_cases:${guildId}:${userId}:${type || "all"}`,
};

async function getCached(key, dbFetch, ttlSeconds) {
  
  if (isRedisAvailable()) {
    try {
      const cached = await get(key);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          
          await del(key);
        }
      }
    } catch (error) {
      
    }
  }

  const data = await dbFetch();

  if (data && isRedisAvailable()) {
    try {
      await set(key, JSON.stringify(data), ttlSeconds);
    } catch (error) {
      
    }
  }

  return data;
}

export async function getCachedColorRoles(guildId, dbFetch) {
  const key = EXTENDED_KEYS.colorRoles(guildId);
  return await getCached(key, dbFetch, EXTENDED_TTL.COLOR_ROLES) || [];
}

export async function invalidateColorRolesCache(guildId) {
  const key = EXTENDED_KEYS.colorRoles(guildId);
  await del(key);
}

export async function getCachedUserStats(guildId, userId, dbFetch) {
  const key = EXTENDED_KEYS.userStats(guildId, userId);
  return await getCached(key, dbFetch, EXTENDED_TTL.USER_STATS);
}

export async function invalidateUserStatsCache(guildId, userId) {
  const key = EXTENDED_KEYS.userStats(guildId, userId);
  await del(key);
}

export async function getCachedBlacklist(guildId, userId, dbFetch) {
  const key = EXTENDED_KEYS.blacklistAll(guildId, userId);
  return await getCached(key, dbFetch, EXTENDED_TTL.BLACKLIST_ALL) || [];
}

export async function invalidateBlacklistCache(guildId, userId) {
  const key = EXTENDED_KEYS.blacklistAll(guildId, userId);
  await del(key);
}

export async function invalidateBlacklistCacheGuild(guildId) {

}

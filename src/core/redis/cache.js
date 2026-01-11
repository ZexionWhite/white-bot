import { get, set, del } from "./helpers.js";
import { isRedisAvailable } from "./client.js";

export const TTL = {
  GUILD_SETTINGS: 300,      
  COLOR_ROLES: 180,         
  COOLDOWN: 0,              
  USER_STATS: 120,          
  MOD_CASES: 60,            
  BLACKLIST: 180,           
  PERMISSIONS: 120,         
};

export const KEYS = {
  guildSettings: (guildId) => `capy:cache:settings:${guildId}`,
  colorRoles: (guildId) => `capy:cache:color_roles:${guildId}`,
  userStats: (guildId, userId) => `capy:cache:stats:${guildId}:${userId}`,
  modCases: (guildId, userId, type) => `capy:cache:cases:${guildId}:${userId}:${type || "all"}`,
  blacklist: (guildId, userId) => `capy:cache:blacklist:${guildId}:${userId}`,
};

export async function getCachedSettings(guildId, dbFetch) {
  const cacheKey = KEYS.guildSettings(guildId);

  if (isRedisAvailable()) {
    try {
      const cached = await get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (parseError) {
          
          await del(cacheKey);
        }
      }
    } catch (error) {
      
    }
  }

  const settings = await dbFetch();

  if (settings && isRedisAvailable()) {
    try {
      await set(cacheKey, JSON.stringify(settings), TTL.GUILD_SETTINGS);
    } catch (error) {
      
    }
  }

  return settings;
}

export async function invalidateSettingsCache(guildId) {
  const cacheKey = KEYS.guildSettings(guildId);
  await del(cacheKey);
}

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
      
    }
  }

  if (keysToDelete.length > 0) {
    await del(keysToDelete);
  }
}

import { getCachedSettings, invalidateSettingsCache } from "../redis/cache.js";
import { getSettings as getSettingsQuery } from "../../db.js";

export async function getSettings(guildId) {
  return getCachedSettings(guildId, async () => {
    const result = await getSettingsQuery.get(guildId);
    return result || null;
  });
}

export async function invalidateCache(guildId) {
  await invalidateSettingsCache(guildId);
}

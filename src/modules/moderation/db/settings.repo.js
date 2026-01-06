import { getSettings as getSettingsQuery, upsertSettings } from "../../../db.js";
import { getCachedSettings, invalidateSettingsCache } from "../../../core/redis/cache.js";

export async function getGuildSettings(guildId) {
  // Usar cache-aside: Redis -> PostgreSQL -> Cache
  return await getCachedSettings(guildId, async () => {
    return (await getSettingsQuery.get(guildId)) || {};
  }) || {};
}

export async function updateGuildSettings(guildId, updates) {
  const current = await getGuildSettings(guildId);
  await upsertSettings.run({
    guild_id: guildId,
    welcome_channel_id: updates.welcome_channel_id ?? current.welcome_channel_id ?? null,
    log_channel_id: updates.log_channel_id ?? current.log_channel_id ?? null,
    autorole_channel_id: updates.autorole_channel_id ?? current.autorole_channel_id ?? null,
    autorole_message_id: updates.autorole_message_id ?? current.autorole_message_id ?? null,
    booster_role_id: updates.booster_role_id ?? current.booster_role_id ?? null,
    booster_announce_channel_id: updates.booster_announce_channel_id ?? current.booster_announce_channel_id ?? null,
    welcome_cd_minutes: updates.welcome_cd_minutes ?? current.welcome_cd_minutes ?? 60,
    info_channel_id: updates.info_channel_id ?? current.info_channel_id ?? null,
    message_log_channel_id: updates.message_log_channel_id ?? current.message_log_channel_id ?? null,
    avatar_log_channel_id: updates.avatar_log_channel_id ?? current.avatar_log_channel_id ?? null,
    nickname_log_channel_id: updates.nickname_log_channel_id ?? current.nickname_log_channel_id ?? null,
    voice_log_channel_id: updates.voice_log_channel_id ?? current.voice_log_channel_id ?? null,
    modlog_channel_id: updates.modlog_channel_id ?? current.modlog_channel_id ?? null,
    blacklist_channel_id: updates.blacklist_channel_id ?? current.blacklist_channel_id ?? null,
    mute_role_id: updates.mute_role_id ?? current.mute_role_id ?? null,
    dm_on_punish: updates.dm_on_punish ?? current.dm_on_punish ?? 1,
    command_prefix: updates.command_prefix ?? current.command_prefix ?? "capy!",
    locale: updates.locale !== undefined ? updates.locale : (current.locale ?? null)
  });
  
  // Invalidar cache después de actualizar
  await invalidateSettingsCache(guildId);
}

/**
 * Obtiene el locale configurado para un guild
 * @param {string} guildId
 * @returns {Promise<string|null>} Locale o null si usa detección automática
 */
export async function getGuildLocale(guildId) {
  const settings = await getGuildSettings(guildId);
  return settings?.locale || null;
}

/**
 * Establece el locale para un guild
 * @param {string} guildId
 * @param {string|null} locale - "es-ES", "en-US" o null para auto-detección
 */
export async function setGuildLocale(guildId, locale) {
  await updateGuildSettings(guildId, { locale });
  // updateGuildSettings already calls invalidateSettingsCache, so cache is already cleared
}


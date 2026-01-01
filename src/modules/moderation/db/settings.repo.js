import { getSettings, upsertSettings } from "../../../db.js";

export function getGuildSettings(guildId) {
  return getSettings.get(guildId) || {};
}

export function updateGuildSettings(guildId, updates) {
  const current = getGuildSettings(guildId);
  upsertSettings.run({
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
    dm_on_punish: updates.dm_on_punish ?? current.dm_on_punish ?? 1
  });
}


/**
 * Helper para actualizar todos los campos de settings
 * Se usa para asegurar que command_prefix siempre esté presente
 */

import { getSettings } from "../../../db.js";

export async function getAllSettingsFields(guildId, updates) {
  const row = (await getSettings.get(guildId)) ?? {};
  return {
    guild_id: guildId,
    welcome_channel_id: updates.welcome_channel_id ?? row.welcome_channel_id ?? null,
    log_channel_id: updates.log_channel_id ?? row.log_channel_id ?? null,
    autorole_channel_id: updates.autorole_channel_id ?? row.autorole_channel_id ?? null,
    autorole_message_id: updates.autorole_message_id ?? row.autorole_message_id ?? null,
    booster_role_id: updates.booster_role_id ?? row.booster_role_id ?? null,
    booster_announce_channel_id: updates.booster_announce_channel_id ?? row.booster_announce_channel_id ?? null,
    welcome_cd_minutes: updates.welcome_cd_minutes ?? row.welcome_cd_minutes ?? 60,
    info_channel_id: updates.info_channel_id ?? row.info_channel_id ?? null,
    message_log_channel_id: updates.message_log_channel_id ?? row.message_log_channel_id ?? null,
    avatar_log_channel_id: updates.avatar_log_channel_id ?? row.avatar_log_channel_id ?? null,
    nickname_log_channel_id: updates.nickname_log_channel_id ?? row.nickname_log_channel_id ?? null,
    voice_log_channel_id: updates.voice_log_channel_id ?? row.voice_log_channel_id ?? null,
    modlog_channel_id: updates.modlog_channel_id ?? row.modlog_channel_id ?? null,
    blacklist_channel_id: updates.blacklist_channel_id ?? row.blacklist_channel_id ?? null,
    mute_role_id: updates.mute_role_id ?? row.mute_role_id ?? null,
    dm_on_punish: updates.dm_on_punish ?? row.dm_on_punish ?? 1,
    command_prefix: updates.command_prefix ?? row.command_prefix ?? "capy!"
  };
}

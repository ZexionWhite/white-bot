import { PermissionFlagsBits } from "discord.js";
import { getSettings, upsertSettings } from "../../../db.js";

export async function handle(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
    console.warn(`[settings/booster-role] Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  const role = itx.options.getRole("rol", true);
  const row = getSettings.get(itx.guild.id) ?? {};
  
  try {
    upsertSettings.run({
      guild_id: itx.guild.id,
      welcome_channel_id: row.welcome_channel_id ?? null,
      log_channel_id: row.log_channel_id ?? null,
      autorole_channel_id: row.autorole_channel_id ?? null,
      autorole_message_id: row.autorole_message_id ?? null,
      booster_role_id: role.id,
      booster_announce_channel_id: row.booster_announce_channel_id ?? null,
      welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
      info_channel_id: row.info_channel_id ?? null,
      message_log_channel_id: row.message_log_channel_id ?? null,
      avatar_log_channel_id: row.avatar_log_channel_id ?? null,
      nickname_log_channel_id: row.nickname_log_channel_id ?? null,
      voice_log_channel_id: row.voice_log_channel_id ?? null,
      modlog_channel_id: row.modlog_channel_id ?? null,
      blacklist_channel_id: row.blacklist_channel_id ?? null,
      mute_role_id: row.mute_role_id ?? null,
      dm_on_punish: row.dm_on_punish ?? 1,
      command_prefix: row.command_prefix ?? "capy!"
    });
    console.log(`[settings/booster-role] Rol configurado a ${role.name} (${role.id}) en ${itx.guild.name}`);
  } catch (err) {
    console.error(`[settings/booster-role] Error al guardar configuración:`, err.message);
  }
  
  return itx.reply({ content: `Rol de boosters seteado a **@${role.name}**`, ephemeral: true });
}

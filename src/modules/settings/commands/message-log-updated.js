import { PermissionFlagsBits } from "discord.js";
import { upsertSettings } from "../../../db.js";
import { getAllSettingsFields } from "./_updateAllSettings.js";

export async function handle(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    console.warn(`[settings/message-log] Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
    return itx.reply({ content: "Sin permisos.", ephemeral: true });
  }

  const channel = itx.options.getChannel("canal", true);
  
  try {
    const allFields = await getAllSettingsFields(itx.guild.id, {
      message_log_channel_id: channel.id
    });
    await upsertSettings.run(allFields);
    console.log(`[settings/message-log] Canal configurado a ${channel.name} (${channel.id}) en ${itx.guild.name}`);
  } catch (err) {
    console.error(`[settings/message-log] Error al guardar configuración:`, err.message);
  }
  
  return itx.reply({ content: `Canal de logs de mensajes seteado a <#${channel.id}>`, ephemeral: true });
}

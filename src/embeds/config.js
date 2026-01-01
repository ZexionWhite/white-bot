import { EmbedBuilder } from "discord.js";
import { EMOJIS } from "../config/emojis.js";

export function configEmbed(guild, settings) {
  const fields = [];
  
  // Bienvenidas
  const welcomeCh = settings?.welcome_channel_id 
    ? `<#${settings.welcome_channel_id}>` 
    : "❌ No configurado";
  const logCh = settings?.log_channel_id 
    ? `<#${settings.log_channel_id}>` 
    : "❌ No configurado";
  const welcomeCd = settings?.welcome_cd_minutes ?? 60;
  
  fields.push({
    name: `${EMOJIS.LOGS.USER_JOINED} Bienvenidas`,
    value: [
      `**Canal de bienvenida:** ${welcomeCh}`,
      `**Canal de logs:** ${logCh}`,
      `**Cooldown:** ${welcomeCd} minutos`
    ].join("\n"),
    inline: false
  });

  // Autoroles de color
  const autoroleCh = settings?.autorole_channel_id 
    ? `<#${settings.autorole_channel_id}>` 
    : "❌ No configurado";
  const autoroleMsg = settings?.autorole_message_id 
    ? `[Mensaje](https://discord.com/channels/${guild.id}/${settings.autorole_channel_id}/${settings.autorole_message_id})` 
    : "❌ No publicado";
  
  fields.push({
    name: `${EMOJIS.BOOST.BOOSTER} Autoroles de color`,
    value: [
      `**Canal:** ${autoroleCh}`,
      `**Mensaje:** ${autoroleMsg}`
    ].join("\n"),
    inline: false
  });

  // Boosters
  const boosterRole = settings?.booster_role_id 
    ? `<@&${settings.booster_role_id}>` 
    : "❌ No configurado";
  const boostCh = settings?.booster_announce_channel_id 
    ? `<#${settings.booster_announce_channel_id}>` 
    : "❌ No configurado";
  const infoCh = settings?.info_channel_id 
    ? `<#${settings.info_channel_id}>` 
    : "❌ No configurado";
  
  fields.push({
    name: `${EMOJIS.BOOST.DEV_WHITEBOOSTER} Boosters`,
    value: [
      `**Rol de boosters:** ${boosterRole}`,
      `**Canal de anuncios:** ${boostCh}`,
      `**Canal de info:** ${infoCh}`
    ].join("\n"),
    inline: false
  });

  // Logs
  const msgLog = settings?.message_log_channel_id 
    ? `<#${settings.message_log_channel_id}>` 
    : "❌ No configurado";
  const avatarLog = settings?.avatar_log_channel_id 
    ? `<#${settings.avatar_log_channel_id}>` 
    : "❌ No configurado";
  const nickLog = settings?.nickname_log_channel_id 
    ? `<#${settings.nickname_log_channel_id}>` 
    : "❌ No configurado";
  const voiceLog = settings?.voice_log_channel_id 
    ? `<#${settings.voice_log_channel_id}>` 
    : "❌ No configurado";
  
  fields.push({
    name: `${EMOJIS.UTILS.AUDIT} Logs`,
    value: [
      `**Mensajes:** ${msgLog}`,
      `**Avatares:** ${avatarLog}`,
      `**Apodos:** ${nickLog}`,
      `**Voz:** ${voiceLog}`
    ].join("\n"),
    inline: false
  });

  // Moderación
  const modlogCh = settings?.modlog_channel_id 
    ? `<#${settings.modlog_channel_id}>` 
    : "❌ No configurado";
  const blacklistCh = settings?.blacklist_channel_id 
    ? `<#${settings.blacklist_channel_id}>` 
    : "❌ No configurado";
  const muteRole = settings?.mute_role_id 
    ? `<@&${settings.mute_role_id}>` 
    : "❌ No configurado";
  const dmOnPunish = settings?.dm_on_punish !== undefined 
    ? (settings.dm_on_punish ? "✅ Activado" : "❌ Desactivado")
    : "❌ No configurado";
  
  fields.push({
    name: `${EMOJIS.UTILS.REPORT} Moderación`,
    value: [
      `**Canal de modlog:** ${modlogCh}`,
      `**Canal de blacklist:** ${blacklistCh}`,
      `**Rol de mute:** ${muteRole}`,
      `**DM al sancionar:** ${dmOnPunish}`
    ].join("\n"),
    inline: false
  });

  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} Configuración del servidor`)
    .setDescription(`Configuración actual de **${guild.name}**`)
    .setColor(0x393a41)
    .addFields(fields)
    .setThumbnail(guild.iconURL({ size: 128 }))
    .setFooter({ text: `ID del servidor: ${guild.id}` })
    .setTimestamp();
}

import { EmbedBuilder } from "discord.js";

export function helpEmbed() {
  return new EmbedBuilder()
    .setTitle("📚 Comandos disponibles")
    .setDescription("Lista de todos los comandos del bot y su descripción")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "⚙️ Configuración",
        value: [
          "`/set welcome [canal] [cooldown]` - Canal de bienvenida y cooldown (Admin)",
          "`/set join-log [canal]` - Canal de logs de ingresos (Admin)",
          "`/set message-log [canal]` - Canal para logs de mensajes (Admin)",
          "`/set avatar-log [canal]` - Canal para logs de avatares (Admin)",
          "`/set nickname-log [canal]` - Canal para logs de apodos (Admin)",
          "`/set voice-log [canal]` - Canal para logs de voz (Admin)",
          "`/set boost-channel [canal]` - Canal de anuncios de boost (Admin)",
          "`/set info-channel [canal]` - Canal de información/perks (Admin)",
          "`/set booster-role [rol]` - Rol de boosters (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🎨 Autoroles de color",
        value: [
          "`/setupcolors` - Crea los roles de colores (Admin)",
          "`/color-menu` - Publica el menú de selección de color (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "📊 Utilidades",
        value: [
          "`/preview boost [usuario]` - Previsualiza el embed de boost (Admin)",
          "`/preview welcome [usuario]` - Previsualiza el embed de bienvenida (Admin)",
          "`/stats [usuario]` - Muestra estadísticas de un usuario",
          "`/ping` - Mide latencia y estado del bot",
          "`/help` - Muestra este mensaje",
          "`/config` - Muestra la configuración del servidor (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🛡️ Moderación",
        value: [
          "`/voice-mod channel [canal]` - Modera usuarios en un canal de voz (Mod)",
          "`/voice-mod user [usuario]` - Modera un usuario específico en voz (Mod)"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Los comandos marcados con (Admin) requieren permisos de administrador. (Mod) requiere MuteMembers o MoveMembers" })
    .setTimestamp();
}

export function configEmbed(guild, settings) {
  const fields = [];
  
  const welcomeCh = settings?.welcome_channel_id 
    ? `<#${settings.welcome_channel_id}>` 
    : "❌ No configurado";
  const logCh = settings?.log_channel_id 
    ? `<#${settings.log_channel_id}>` 
    : "❌ No configurado";
  const welcomeCd = settings?.welcome_cd_minutes ?? 60;
  
  fields.push({
    name: "👋 Bienvenidas",
    value: [
      `**Canal de bienvenida:** ${welcomeCh}`,
      `**Canal de logs:** ${logCh}`,
      `**Cooldown:** ${welcomeCd} minutos`
    ].join("\n"),
    inline: false
  });

  const autoroleCh = settings?.autorole_channel_id 
    ? `<#${settings.autorole_channel_id}>` 
    : "❌ No configurado";
  const autoroleMsg = settings?.autorole_message_id 
    ? `[Mensaje](https://discord.com/channels/${guild.id}/${settings.autorole_channel_id}/${settings.autorole_message_id})` 
    : "❌ No publicado";
  
  fields.push({
    name: "🎨 Autoroles de color",
    value: [
      `**Canal:** ${autoroleCh}`,
      `**Mensaje:** ${autoroleMsg}`
    ].join("\n"),
    inline: false
  });

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
    name: "💎 Boosters",
    value: [
      `**Rol de boosters:** ${boosterRole}`,
      `**Canal de anuncios:** ${boostCh}`,
      `**Canal de info:** ${infoCh}`
    ].join("\n"),
    inline: false
  });

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
    name: "📝 Logs",
    value: [
      `**Mensajes:** ${msgLog}`,
      `**Avatares:** ${avatarLog}`,
      `**Apodos:** ${nickLog}`,
      `**Voz:** ${voiceLog}`
    ].join("\n"),
    inline: false
  });

  return new EmbedBuilder()
    .setTitle("⚙️ Configuración del servidor")
    .setDescription(`Configuración actual de **${guild.name}**`)
    .setColor(0x5865f2)
    .addFields(fields)
    .setThumbnail(guild.iconURL({ size: 128 }))
    .setFooter({ text: `ID del servidor: ${guild.id}` })
    .setTimestamp();
}


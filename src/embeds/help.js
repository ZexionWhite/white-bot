import { EmbedBuilder } from "discord.js";

export function helpEmbed() {
  return new EmbedBuilder()
    .setTitle("📚 Comandos disponibles")
    .setDescription("Lista de todos los comandos del bot y su descripción")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "👋 Bienvenidas",
        value: [
          "`/setwelcome` - Define el canal de bienvenida (Admin)",
          "`/setlog` - Define el canal de logs de ingresos (Admin)",
          "`/setwelcomecd` - Define el cooldown del mensaje de bienvenida (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🎨 Autoroles de color",
        value: [
          "`/setupcolors` - Crea los roles de colores (Admin)",
          "`/postautoroles` - Publica el menú de selección de color (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "💎 Boosters",
        value: [
          "`/setboosterrole` - Define el rol de boosters (Admin)",
          "`/setboostchannel` - Define el canal de anuncios de boost (Admin)",
          "`/preview boost` - Previsualiza el embed de boost (Admin)",
          "`/preview welcome` - Previsualiza el embed de bienvenida (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "📝 Logs",
        value: [
          "`/setmessagelog` - Canal para logs de mensajes (Admin)",
          "`/setavatarlog` - Canal para logs de avatares (Admin)",
          "`/setnicklog` - Canal para logs de apodos (Admin)",
          "`/setvoicelog` - Canal para logs de voz (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "⚙️ Configuración",
        value: [
          "`/setinfochannel` - Canal de información/perks (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "📊 Utilidades",
        value: [
          "`/userstats [usuario]` - Muestra estadísticas de un usuario",
          "`/ping` - Mide latencia y estado del bot",
          "`/help` - Muestra este mensaje",
          "`/config` - Muestra la configuración del servidor (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🛡️ Moderación",
        value: [
          "`/mod voicechat [canal]` - Modera usuarios en un canal de voz (Mod)",
          "`/mod voiceuser [usuario]` - Modera un usuario específico en voz (Mod)"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Los comandos marcados con (Admin) requieren permisos de administrador" })
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


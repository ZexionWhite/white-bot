import { EmbedBuilder } from "discord.js";

export function configEmbed(guild, settings) {
  const embed = new EmbedBuilder()
    .setTitle(`⚙️ Configuración de ${guild.name}`)
    .setColor(0x5865f2)
    .setThumbnail(guild.iconURL({ size: 128, extension: "png" }))
    .setTimestamp();

  const fields = [];

  if (settings.welcome_channel_id) {
    fields.push({ 
      name: "📥 Canal de Bienvenida", 
      value: `<#${settings.welcome_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.log_channel_id) {
    fields.push({ 
      name: "📋 Canal de Logs (Admin)", 
      value: `<#${settings.log_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.message_log_channel_id) {
    fields.push({ 
      name: "💬 Logs de Mensajes", 
      value: `<#${settings.message_log_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.avatar_log_channel_id) {
    fields.push({ 
      name: "🖼️ Logs de Avatares", 
      value: `<#${settings.avatar_log_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.nickname_log_channel_id) {
    fields.push({ 
      name: "👤 Logs de Apodos", 
      value: `<#${settings.nickname_log_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.voice_log_channel_id) {
    fields.push({ 
      name: "🎤 Logs de Voz", 
      value: `<#${settings.voice_log_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.modlog_channel_id) {
    fields.push({ 
      name: "🛡️ Modlog", 
      value: `<#${settings.modlog_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.booster_announce_channel_id) {
    fields.push({ 
      name: "💎 Canal de Boosts", 
      value: `<#${settings.booster_announce_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.info_channel_id) {
    fields.push({ 
      name: "ℹ️ Canal de Info", 
      value: `<#${settings.info_channel_id}>`, 
      inline: true 
    });
  }

  if (settings.mute_role_id) {
    const role = guild.roles.cache.get(settings.mute_role_id);
    fields.push({ 
      name: "🔇 Rol de Mute", 
      value: role ? `<@&${settings.mute_role_id}>` : `\`${settings.mute_role_id}\` (rol no encontrado)`, 
      inline: true 
    });
  }

  if (settings.booster_role_id) {
    const role = guild.roles.cache.get(settings.booster_role_id);
    fields.push({ 
      name: "💎 Rol de Boosters", 
      value: role ? `<@&${settings.booster_role_id}>` : `\`${settings.booster_role_id}\` (rol no encontrado)`, 
      inline: true 
    });
  }

  if (settings.welcome_cd_minutes) {
    fields.push({ 
      name: "⏱️ Cooldown de Bienvenida", 
      value: `${settings.welcome_cd_minutes} minutos`, 
      inline: true 
    });
  }

  if (settings.command_prefix) {
    fields.push({ 
      name: "🔧 Prefijo de Comandos", 
      value: `\`${settings.command_prefix}\``, 
      inline: true 
    });
  }

  if (fields.length === 0) {
    embed.setDescription("No hay configuración establecida.");
  } else {
    embed.setFields(fields);
  }

  return embed;
}

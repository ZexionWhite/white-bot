import { EmbedBuilder } from "discord.js";

export function configEmbed(guild, settings) {
  const embed = new EmbedBuilder()
    .setTitle(`⚙️ Configuración de ${guild.name}`)
    .setColor(0x5865f2)
    .setThumbnail(guild.iconURL({ size: 128, extension: "png" }))
    .setTimestamp();

  const formatChannel = (channelId) => channelId ? `<#${channelId}>` : "*No configurado*";
  const formatRole = (roleId) => {
    if (!roleId) return "*No configurado*";
    const role = guild.roles.cache.get(roleId);
    return role ? `<@&${roleId}>` : `\`${roleId}\` *(rol no encontrado)*`;
  };

  const fields = [
    { 
      name: "📥 Canal de Bienvenida", 
      value: formatChannel(settings.welcome_channel_id), 
      inline: true 
    },
    { 
      name: "📋 Canal de Logs (Admin)", 
      value: formatChannel(settings.log_channel_id), 
      inline: true 
    },
    { 
      name: "💬 Logs de Mensajes", 
      value: formatChannel(settings.message_log_channel_id), 
      inline: true 
    },
    { 
      name: "🖼️ Logs de Avatares", 
      value: formatChannel(settings.avatar_log_channel_id), 
      inline: true 
    },
    { 
      name: "👤 Logs de Apodos", 
      value: formatChannel(settings.nickname_log_channel_id), 
      inline: true 
    },
    { 
      name: "🎤 Logs de Voz", 
      value: formatChannel(settings.voice_log_channel_id), 
      inline: true 
    },
    { 
      name: "🛡️ Modlog", 
      value: formatChannel(settings.modlog_channel_id), 
      inline: true 
    },
    { 
      name: "📋 Canal de Blacklist", 
      value: formatChannel(settings.blacklist_channel_id), 
      inline: true 
    },
    { 
      name: "💎 Canal de Boosts", 
      value: formatChannel(settings.booster_announce_channel_id), 
      inline: true 
    },
    { 
      name: "ℹ️ Canal de Info", 
      value: formatChannel(settings.info_channel_id), 
      inline: true 
    },
    { 
      name: "🔇 Rol de Mute", 
      value: formatRole(settings.mute_role_id), 
      inline: true 
    },
    { 
      name: "💎 Rol de Boosters", 
      value: formatRole(settings.booster_role_id), 
      inline: true 
    },
    { 
      name: "⏱️ Cooldown de Bienvenida", 
      value: settings.welcome_cd_minutes ? `${settings.welcome_cd_minutes} minutos` : "*No configurado*", 
      inline: true 
    },
    { 
      name: "🔧 Prefijo de Comandos", 
      value: settings.command_prefix ? `\`${settings.command_prefix}\`` : "*No configurado*", 
      inline: true 
    },
    { 
      name: "📨 DM al Sancionar", 
      value: settings.dm_on_punish ? "Habilitado" : "Deshabilitado", 
      inline: true 
    },
    { 
      name: "🎨 Canal de Autoroles", 
      value: formatChannel(settings.autorole_channel_id), 
      inline: true 
    }
  ];

  embed.setFields(fields);

  return embed;
}

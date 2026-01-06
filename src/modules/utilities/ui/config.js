import { EmbedBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export function configEmbed(guild, settings, locale = DEFAULT_LOCALE) {
  const embed = new EmbedBuilder()
    .setTitle(t(locale, "utilities.config.title", { guildName: guild.name }))
    .setColor(0x5865f2)
    .setThumbnail(guild.iconURL({ size: 128, extension: "png" }))
    .setTimestamp();

  const formatChannel = (channelId) => channelId ? `<#${channelId}>` : t(locale, "utilities.config.not_configured");
  const formatRole = (roleId) => {
    if (!roleId) return t(locale, "utilities.config.not_configured");
    const role = guild.roles.cache.get(roleId);
    return role ? `<@&${roleId}>` : `\`${roleId}\` ${t(locale, "utilities.config.role_not_found")}`;
  };

  const fields = [
    { 
      name: t(locale, "utilities.config.fields.welcome_channel"), 
      value: formatChannel(settings.welcome_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.log_channel"), 
      value: formatChannel(settings.log_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.message_log"), 
      value: formatChannel(settings.message_log_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.avatar_log"), 
      value: formatChannel(settings.avatar_log_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.nickname_log"), 
      value: formatChannel(settings.nickname_log_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.voice_log"), 
      value: formatChannel(settings.voice_log_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.modlog"), 
      value: formatChannel(settings.modlog_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.blacklist_channel"), 
      value: formatChannel(settings.blacklist_channel_id), 
      inline: true 
    },
    { 
      name: `${EMOJIS.BOOST.BOOSTER} ${t(locale, "utilities.config.fields.boost_channel")}`, 
      value: formatChannel(settings.booster_announce_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.info_channel"), 
      value: formatChannel(settings.info_channel_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.mute_role"), 
      value: formatRole(settings.mute_role_id), 
      inline: true 
    },
    { 
      name: `${EMOJIS.BOOST.BOOSTER} ${t(locale, "utilities.config.fields.booster_role")}`, 
      value: formatRole(settings.booster_role_id), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.welcome_cooldown"), 
      value: settings.welcome_cd_minutes ? t(locale, "utilities.config.cooldown_minutes", { minutes: settings.welcome_cd_minutes }) : t(locale, "utilities.config.not_configured"), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.command_prefix"), 
      value: settings.command_prefix ? `\`${settings.command_prefix}\`` : t(locale, "utilities.config.not_configured"), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.dm_on_punish"), 
      value: settings.dm_on_punish ? t(locale, "utilities.config.dm_enabled") : t(locale, "utilities.config.dm_disabled"), 
      inline: true 
    },
    { 
      name: t(locale, "utilities.config.fields.autorole_channel"), 
      value: formatChannel(settings.autorole_channel_id), 
      inline: true 
    }
  ];

  embed.setFields(fields);

  return embed;
}

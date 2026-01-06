import { EmbedBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export function getIntroEmbed(client, locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(t(locale, "utilities.help.intro.title"))
    .setDescription(t(locale, "utilities.help.intro.description"))
    .setThumbnail(client.user.displayAvatarURL())
    .setColor(0x393a41)
    .setFooter({ text: t(locale, "utilities.help.intro.footer") })
    .setTimestamp();
}

export function getConfigEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.CONFIG} ${t(locale, "utilities.help.config.title")}`)
    .setDescription(t(locale, "utilities.help.config.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.config.fields.welcome_channel.name"),
        value: t(locale, "utilities.help.config.fields.welcome_channel.value"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.config.fields.server_logs.name"),
        value: [
          t(locale, "utilities.help.config.fields.server_logs.value_join"),
          t(locale, "utilities.help.config.fields.server_logs.value_message"),
          t(locale, "utilities.help.config.fields.server_logs.value_avatar"),
          t(locale, "utilities.help.config.fields.server_logs.value_nickname"),
          t(locale, "utilities.help.config.fields.server_logs.value_voice")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.config.fields.boosters.name"),
        value: [
          t(locale, "utilities.help.config.fields.boosters.value_boost"),
          t(locale, "utilities.help.config.fields.boosters.value_info"),
          t(locale, "utilities.help.config.fields.boosters.value_role")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.config.fields.moderation.name"),
        value: [
          t(locale, "utilities.help.config.fields.moderation.value_modlog"),
          t(locale, "utilities.help.config.fields.moderation.value_blacklist"),
          t(locale, "utilities.help.config.fields.moderation.value_createmute"),
          t(locale, "utilities.help.config.fields.moderation.value_setmute")
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.config.footer") })
    .setTimestamp();
}

export function getModerationEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.REPORT} ${t(locale, "utilities.help.moderation.title")}`)
    .setDescription(t(locale, "utilities.help.moderation.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.moderation.fields.warnings.name"),
        value: [
          t(locale, "utilities.help.moderation.fields.warnings.value_warn"),
          t(locale, "utilities.help.moderation.fields.warnings.value_mute"),
          t(locale, "utilities.help.moderation.fields.warnings.value_unmute")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.moderation.fields.timeouts.name"),
        value: [
          t(locale, "utilities.help.moderation.fields.timeouts.value_timeout"),
          t(locale, "utilities.help.moderation.fields.timeouts.value_untimeout")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.moderation.fields.bans.name"),
        value: [
          t(locale, "utilities.help.moderation.fields.bans.value_kick"),
          t(locale, "utilities.help.moderation.fields.bans.value_ban"),
          t(locale, "utilities.help.moderation.fields.bans.value_tempban"),
          t(locale, "utilities.help.moderation.fields.bans.value_softban"),
          t(locale, "utilities.help.moderation.fields.bans.value_unban")
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.moderation.footer") })
    .setTimestamp();
}

export function getCasesEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.UTILITIES} ${t(locale, "utilities.help.cases.title")}`)
    .setDescription(t(locale, "utilities.help.cases.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.cases.fields.case_management.name"),
        value: [
          t(locale, "utilities.help.cases.fields.case_management.value_history"),
          t(locale, "utilities.help.cases.fields.case_management.value_case"),
          t(locale, "utilities.help.cases.fields.case_management.value_editcase"),
          t(locale, "utilities.help.cases.fields.case_management.value_remove")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.cases.fields.channel_management.name"),
        value: [
          t(locale, "utilities.help.cases.fields.channel_management.value_clear"),
          t(locale, "utilities.help.cases.fields.channel_management.value_lock"),
          t(locale, "utilities.help.cases.fields.channel_management.value_unlock"),
          t(locale, "utilities.help.cases.fields.channel_management.value_slowmode")
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.cases.footer") })
    .setTimestamp();
}

export function getBlacklistEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.QUARANTINE} ${t(locale, "utilities.help.blacklist.title")}`)
    .setDescription(t(locale, "utilities.help.blacklist.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.blacklist.fields.management.name"),
        value: [
          t(locale, "utilities.help.blacklist.fields.management.value_add"),
          t(locale, "utilities.help.blacklist.fields.management.value_history"),
          t(locale, "utilities.help.blacklist.fields.management.value_edit"),
          t(locale, "utilities.help.blacklist.fields.management.value_remove")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.blacklist.fields.severities.name"),
        value: t(locale, "utilities.help.blacklist.fields.severities.value"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.blacklist.footer") })
    .setTimestamp();
}

export function getInfoEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.SEARCH} ${t(locale, "utilities.help.info.title")}`)
    .setDescription(t(locale, "utilities.help.info.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.info.fields.advanced.name"),
        value: t(locale, "utilities.help.info.fields.advanced.value"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.info.footer") })
    .setTimestamp();
}

export function getVoiceEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.VOICE} ${t(locale, "utilities.help.voice.title")}`)
    .setDescription(t(locale, "utilities.help.voice.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.voice.fields.channel.name"),
        value: t(locale, "utilities.help.voice.fields.channel.value"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.voice.fields.user.name"),
        value: t(locale, "utilities.help.voice.fields.user.value"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.voice.footer") })
    .setTimestamp();
}

export function getUtilitiesEmbed(locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setTitle(`${EMOJIS.UTILS.LIST} ${t(locale, "utilities.help.utilities.title")}`)
    .setDescription(t(locale, "utilities.help.utilities.description"))
    .setColor(0x393a41)
    .addFields(
      {
        name: t(locale, "utilities.help.utilities.fields.preview.name"),
        value: [
          t(locale, "utilities.help.utilities.fields.preview.value_boost"),
          t(locale, "utilities.help.utilities.fields.preview.value_welcome")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.utilities.fields.autoroles.name"),
        value: [
          t(locale, "utilities.help.utilities.fields.autoroles.value_setup"),
          t(locale, "utilities.help.utilities.fields.autoroles.value_menu")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.utilities.fields.bot_info.name"),
        value: [
          t(locale, "utilities.help.utilities.fields.bot_info.value_ping"),
          t(locale, "utilities.help.utilities.fields.bot_info.value_help"),
          t(locale, "utilities.help.utilities.fields.bot_info.value_config")
        ].join("\n"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.utilities.fields.prefix.name"),
        value: t(locale, "utilities.help.utilities.fields.prefix.value"),
        inline: false
      },
      {
        name: t(locale, "utilities.help.utilities.fields.permissions.name"),
        value: [
          t(locale, "utilities.help.utilities.fields.permissions.value_view"),
          t(locale, "utilities.help.utilities.fields.permissions.value_module"),
          t(locale, "utilities.help.utilities.fields.permissions.value_command"),
          t(locale, "utilities.help.utilities.fields.permissions.value_reset")
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: t(locale, "utilities.help.utilities.footer") })
    .setTimestamp();
}

export function getEmbedByCategory(category, client, locale = DEFAULT_LOCALE) {
  switch (category) {
    case "intro":
      return getIntroEmbed(client, locale);
    case "config":
      return getConfigEmbed(locale);
    case "moderation":
      return getModerationEmbed(locale);
    case "cases":
      return getCasesEmbed(locale);
    case "blacklist":
      return getBlacklistEmbed(locale);
    case "info":
      return getInfoEmbed(locale);
    case "voice":
      return getVoiceEmbed(locale);
    case "utilities":
      return getUtilitiesEmbed(locale);
    default:
      return getIntroEmbed(client, locale);
  }
}

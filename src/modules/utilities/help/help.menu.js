import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export function createHelpSelectMenu(currentCategory = "intro", locale = DEFAULT_LOCALE) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help:select")
      .setPlaceholder(t(locale, "utilities.help.menu.placeholder"))
      .addOptions([
        {
          label: t(locale, "utilities.help.menu.intro"),
          value: "intro",
          emoji: EMOJIS.UTILS.HELP,
          default: currentCategory === "intro"
        },
        {
          label: t(locale, "utilities.help.menu.config"),
          value: "config",
          emoji: EMOJIS.UTILS.CONFIG,
          default: currentCategory === "config"
        },
        {
          label: t(locale, "utilities.help.menu.moderation"),
          value: "moderation",
          emoji: EMOJIS.UTILS.REPORT,
          default: currentCategory === "moderation"
        },
        {
          label: t(locale, "utilities.help.menu.cases"),
          value: "cases",
          emoji: EMOJIS.UTILS.UTILITIES,
          default: currentCategory === "cases"
        },
        {
          label: t(locale, "utilities.help.menu.blacklist"),
          value: "blacklist",
          emoji: EMOJIS.UTILS.QUARANTINE,
          default: currentCategory === "blacklist"
        },
        {
          label: t(locale, "utilities.help.menu.info"),
          value: "info",
          emoji: EMOJIS.UTILS.SEARCH,
          default: currentCategory === "info"
        },
        {
          label: t(locale, "utilities.help.menu.voice"),
          value: "voice",
          emoji: EMOJIS.UTILS.VOICE,
          default: currentCategory === "voice"
        },
        {
          label: t(locale, "utilities.help.menu.utilities"),
          value: "utilities",
          emoji: EMOJIS.UTILS.LIST,
          default: currentCategory === "utilities"
        }
      ])
  );
}

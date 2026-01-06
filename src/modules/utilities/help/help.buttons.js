import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export function createCloseButton(locale = DEFAULT_LOCALE) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("help:close")
      .setLabel(t(locale, "utilities.help.buttons.close"))
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );
}

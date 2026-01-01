import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function createCloseButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("help:close")
      .setLabel("Cerrar ayuda")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );
}


import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";

export function createPaginationComponents(page, totalPages, customIdPrefix) {
  const row = new ActionRowBuilder();

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIdPrefix}:prev:${page}`)
      .setLabel("◀ Anterior")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`${customIdPrefix}:next:${page}`)
      .setLabel("Siguiente ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );

  return [row];
}

export function createUserinfoSelectMenu(customId, currentView = "overview") {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder("Select a view...")
      .addOptions([
        { label: "Overview", value: "overview", emoji: EMOJIS.UTILS.INFO, default: currentView === "overview" },
        { label: "Sanctions", value: "sanctions", emoji: EMOJIS.UTILS.REPORT, default: currentView === "sanctions" },
        { label: "Voice Activity", value: "voice", emoji: EMOJIS.UTILS.VOICE, default: currentView === "voice" },
        { label: "Recent Messages", value: "messages", emoji: EMOJIS.UTILS.TEXTCHANNEL, default: currentView === "messages" },
        { label: "Permissions/Overrides", value: "permissions", emoji: EMOJIS.UTILS.FILTER, default: currentView === "permissions" },
        { label: "Statistics", value: "statistics", emoji: EMOJIS.UTILS.LIST, default: currentView === "statistics" }
      ])
  );
}


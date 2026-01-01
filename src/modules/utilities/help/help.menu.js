import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";

export function createHelpSelectMenu(currentCategory = "intro") {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help:select")
      .setPlaceholder("Selecciona una categoría...")
      .addOptions([
        {
          label: "Introducción",
          value: "intro",
          emoji: EMOJIS.UTILS.HELP,
          default: currentCategory === "intro"
        },
        {
          label: "Configuración",
          value: "config",
          emoji: EMOJIS.UTILS.CONFIG,
          default: currentCategory === "config"
        },
        {
          label: "Moderación",
          value: "moderation",
          emoji: EMOJIS.UTILS.REPORT,
          default: currentCategory === "moderation"
        },
        {
          label: "Casos y Herramientas",
          value: "cases",
          emoji: EMOJIS.UTILS.UTILITIES,
          default: currentCategory === "cases"
        },
        {
          label: "Blacklist",
          value: "blacklist",
          emoji: EMOJIS.UTILS.QUARANTINE,
          default: currentCategory === "blacklist"
        },
        {
          label: "Información",
          value: "info",
          emoji: EMOJIS.UTILS.SEARCH,
          default: currentCategory === "info"
        },
        {
          label: "Voz",
          value: "voice",
          emoji: EMOJIS.UTILS.VOICE,
          default: currentCategory === "voice"
        },
        {
          label: "Utilidades",
          value: "utilities",
          emoji: EMOJIS.UTILS.LIST,
          default: currentCategory === "utilities"
        }
      ])
  );
}


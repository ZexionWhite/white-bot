/**
 * Comando /language para gestionar el idioma del bot en el servidor
 */
import { EmbedBuilder, MessageFlags } from "discord.js";
import { setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES } from "../../../core/i18n/index.js";
import { t } from "../../../core/i18n/index.js";

export const languageCommand = {
  async execute(itx) {
    // Obtener locale para las respuestas (usar default si no hay guild)
    const currentLocale = itx.guild ? await getLocaleForGuild(itx.guild) : "es-ES";
    
    if (!itx.guild) {
      return itx.reply({ 
        content: t(currentLocale, "common.errors.guild_only"),
        flags: MessageFlags.Ephemeral
      });
    }
    const locale = itx.options.getString("language", true);

    if (!SUPPORTED_LOCALES.includes(locale)) {
      return itx.reply({
        content: t(currentLocale, "config.language.errors.invalid_locale"),
        flags: MessageFlags.Ephemeral
      });
    }

    await setGuildLocale(itx.guild.id, locale);

    const embed = new EmbedBuilder()
      .setTitle(t(locale, "config.language.set.title"))
      .setDescription(t(locale, "config.language.set.description", { locale }))
      .setColor(0x00ff00)
      .setTimestamp();

    return itx.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
};

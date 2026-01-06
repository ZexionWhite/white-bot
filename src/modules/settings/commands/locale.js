/**
 * Comando /locale para gestionar el idioma del servidor
 */
import { EmbedBuilder } from "discord.js";
import { getGuildLocale, setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES } from "../../../core/i18n/index.js";
import { t } from "../../../core/i18n/index.js";

export const localeCommand = {
  async execute(itx) {
    if (!itx.guild) {
      return itx.reply({ 
        content: "This command can only be used in a server.",
        ephemeral: true 
      });
    }

    // Obtener locale actual para las respuestas
    const currentLocale = await getLocaleForGuild(itx.guild);
    const locale = itx.options.getString("language", true);

    if (!SUPPORTED_LOCALES.includes(locale)) {
      return itx.reply({
        content: t(currentLocale, "config.locale.errors.invalid_locale"),
        ephemeral: true
      });
    }

    await setGuildLocale(itx.guild.id, locale);

    const embed = new EmbedBuilder()
      .setTitle(t(locale, "config.locale.set.title"))
      .setDescription(t(locale, "config.locale.set.description", { locale }))
      .setColor(0x00ff00)
      .setTimestamp();

    return itx.reply({ embeds: [embed], ephemeral: true });
  }
};

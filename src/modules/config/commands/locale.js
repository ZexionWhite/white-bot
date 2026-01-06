/**
 * Comando /locale para gestionar el idioma del servidor
 */
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { getGuildLocale, setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../../../core/i18n/index.js";
import { t } from "../../../core/i18n/index.js";

/**
 * Opciones de locale para el comando
 */
const LOCALE_CHOICES = [
  { name: "Español (España)", value: "es-ES" },
  { name: "English (US)", value: "en-US" }
];

export const localeCommand = {
  name: "locale",
  description: "Manage server language / Gestionar idioma del servidor",
  defaultMemberPermissions: ["ManageGuild"],
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "view",
      description: "View current language / Ver idioma actual"
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "set",
      description: "Set server language / Establecer idioma del servidor",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "language",
          description: "Language / Idioma",
          required: true,
          choices: LOCALE_CHOICES
        }
      ]
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "auto",
      description: "Use automatic detection / Usar detección automática"
    }
  ],
  async execute(itx) {
    if (!itx.guild) {
      return itx.reply({ 
        content: "This command can only be used in a server.",
        ephemeral: true 
      });
    }

    // Obtener locale actual para las respuestas
    const currentLocale = await getLocaleForGuild(itx.guild);

    const subcommand = itx.options.getSubcommand();

    if (subcommand === "view") {
      const dbLocale = await getGuildLocale(itx.guild.id);
      const discordLocale = itx.guild.preferredLocale;
      
      let statusText;
      if (dbLocale) {
        statusText = t(currentLocale, "config.locale.view.manual", { locale: dbLocale });
      } else {
        statusText = t(currentLocale, "config.locale.view.auto", { 
          detected: currentLocale,
          discord: discordLocale || "N/A"
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(t(currentLocale, "config.locale.view.title"))
        .setDescription(statusText)
        .setColor(0x5865f2)
        .setFooter({ text: t(currentLocale, "config.locale.view.footer") })
        .setTimestamp();

      return itx.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === "set") {
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

    if (subcommand === "auto") {
      await setGuildLocale(itx.guild.id, null);

      const embed = new EmbedBuilder()
        .setTitle(t(currentLocale, "config.locale.auto.title"))
        .setDescription(t(currentLocale, "config.locale.auto.description"))
        .setColor(0x5865f2)
        .setTimestamp();

      return itx.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

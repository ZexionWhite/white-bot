/**
 * Comando de prefijo para gestionar el idioma del bot en el servidor
 */
import { PermissionFlagsBits } from "discord.js";
import { setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES, t } from "../../../core/i18n/index.js";
import { EmbedBuilder } from "discord.js";

export async function registerLanguagePrefixCommand() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  registerCommands([
    {
      name: "language",
      aliases: ["idioma", "lang"],
      description: "Configure the bot language for this server",
      permissions: PermissionFlagsBits.ManageGuild,
      argsSchema: null,
      execute: async (ctx) => {
        const locale = await getLocaleForGuild(ctx.guild);
        const rawArgs = ctx.args?.rawArgs || [];
        
        if (rawArgs.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle(t(locale, "config.language.view.title"))
            .setDescription(
              `${t(locale, "config.language.view.usage")}\n` +
              `\`${ctx.prefix}language es\` - ${t(locale, "config.language.view.usage_es")}\n` +
              `\`${ctx.prefix}language en\` - ${t(locale, "config.language.view.usage_en")}`
            )
            .setColor(0x5865f2)
            .setTimestamp();
          
          return ctx.reply({ embeds: [embed] });
        }
        
        const localeArg = rawArgs[0].toLowerCase();
        let targetLocale;
        
        if (localeArg === "es" || localeArg === "es-es" || localeArg === "spanish" || localeArg === "español") {
          targetLocale = "es-ES";
        } else if (localeArg === "en" || localeArg === "en-us" || localeArg === "english" || localeArg === "inglés") {
          targetLocale = "en-US";
        } else if (SUPPORTED_LOCALES.includes(localeArg)) {
          targetLocale = localeArg;
        } else {
          return ctx.reply({ content: t(locale, "config.language.errors.invalid_locale") });
        }
        
        await setGuildLocale(ctx.guild.id, targetLocale);
        
        const embed = new EmbedBuilder()
          .setTitle(t(targetLocale, "config.language.set.title"))
          .setDescription(t(targetLocale, "config.language.set.description", { locale: targetLocale }))
          .setColor(0x00ff00)
          .setTimestamp();
        
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

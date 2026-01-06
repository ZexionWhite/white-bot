/**
 * Comando de prefijo para gestionar el idioma del servidor
 */
import { PermissionFlagsBits } from "discord.js";
import { setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES, t } from "../../../core/i18n/index.js";
import { EmbedBuilder } from "discord.js";

export async function registerLocalePrefixCommand() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  registerCommands([
    {
      name: "locale",
      aliases: ["language", "idioma"],
      description: "Configure the server language",
      permissions: PermissionFlagsBits.ManageGuild,
      argsSchema: null,
      execute: async (ctx) => {
        const locale = await getLocaleForGuild(ctx.guild);
        const rawArgs = ctx.args?.rawArgs || [];
        
        if (rawArgs.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle(t(locale, "config.locale.view.title"))
            .setDescription(
              `**Usage:**\n` +
              `\`${ctx.prefix}locale es\` - Set to Spanish\n` +
              `\`${ctx.prefix}locale en\` - Set to English`
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
          return ctx.reply({ content: t(locale, "config.locale.errors.invalid_locale") });
        }
        
        await setGuildLocale(ctx.guild.id, targetLocale);
        
        const embed = new EmbedBuilder()
          .setTitle(t(targetLocale, "config.locale.set.title"))
          .setDescription(t(targetLocale, "config.locale.set.description", { locale: targetLocale }))
          .setColor(0x00ff00)
          .setTimestamp();
        
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

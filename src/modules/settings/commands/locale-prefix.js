/**
 * Comando de prefijo para gestionar el idioma del servidor
 */
import { PermissionFlagsBits } from "discord.js";
import { getGuildLocale, setGuildLocale } from "../../moderation/db/settings.repo.js";
import { getLocaleForGuild, SUPPORTED_LOCALES, DEFAULT_LOCALE, t } from "../../../core/i18n/index.js";
import { EmbedBuilder } from "discord.js";

export async function registerLocalePrefixCommand() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  registerCommands([
    {
      name: "locale",
      aliases: ["language", "idioma"],
      description: "Gestionar el idioma del servidor",
      permissions: PermissionFlagsBits.ManageGuild,
      argsSchema: null, // No requiere argumentos, muestra ayuda
      execute: async (ctx) => {
        const locale = await getLocaleForGuild(ctx.guild);
        const dbLocale = await getGuildLocale(ctx.guild.id);
        const discordLocale = ctx.guild.preferredLocale;
        
        const rawArgs = ctx.args?.rawArgs || [];
        
        if (rawArgs.length === 0) {
          // Mostrar estado actual
          let statusText;
          if (dbLocale) {
            statusText = t(locale, "config.locale.view.manual", { locale: dbLocale });
          } else {
            statusText = t(locale, "config.locale.view.auto", {
              detected: locale,
              discord: discordLocale || "N/A"
            });
          }
          
          const embed = new EmbedBuilder()
            .setTitle(t(locale, "config.locale.view.title"))
            .setDescription(statusText)
            .setColor(0x5865f2)
            .setFooter({ text: t(locale, "config.locale.view.footer") })
            .setTimestamp();
          
          return ctx.reply({ embeds: [embed] });
        }
        
        const action = rawArgs[0].toLowerCase();
        
        if (action === "view" || action === "ver") {
          let statusText;
          if (dbLocale) {
            statusText = t(locale, "config.locale.view.manual", { locale: dbLocale });
          } else {
            statusText = t(locale, "config.locale.view.auto", {
              detected: locale,
              discord: discordLocale || "N/A"
            });
          }
          
          const embed = new EmbedBuilder()
            .setTitle(t(locale, "config.locale.view.title"))
            .setDescription(statusText)
            .setColor(0x5865f2)
            .setFooter({ text: t(locale, "config.locale.view.footer") })
            .setTimestamp();
          
          return ctx.reply({ embeds: [embed] });
        }
        
        if (action === "set" || action === "establecer") {
          if (!rawArgs[1]) {
            return ctx.reply({ content: t(locale, "config.locale.errors.invalid_locale") });
          }
          
          const localeArg = rawArgs[1].toLowerCase();
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
        
        if (action === "auto" || action === "automático") {
          await setGuildLocale(ctx.guild.id, null);
          
          const currentLocale = await getLocaleForGuild(ctx.guild);
          
          const embed = new EmbedBuilder()
            .setTitle(t(currentLocale, "config.locale.auto.title"))
            .setDescription(t(currentLocale, "config.locale.auto.description"))
            .setColor(0x5865f2)
            .setTimestamp();
          
          return ctx.reply({ embeds: [embed] });
        }
        
        // Si no es ninguna acción válida, mostrar ayuda
        const embed = new EmbedBuilder()
          .setTitle(t(locale, "config.locale.view.title"))
          .setDescription(
            `**Uso:**\n` +
            `\`${ctx.prefix}locale\` - Ver idioma actual\n` +
            `\`${ctx.prefix}locale set <es-ES|en-US>\` - Establecer idioma\n` +
            `\`${ctx.prefix}locale auto\` - Activar detección automática`
          )
          .setColor(0x5865f2)
          .setTimestamp();
        
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

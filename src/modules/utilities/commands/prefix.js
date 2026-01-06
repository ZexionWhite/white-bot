import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";

const emptySchema = null;

/**
 * Registra comandos de utilities para prefix
 */
export async function registerUtilitiesPrefixCommands() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  registerCommands([
    {
      name: "ping",
      aliases: ["latency", "pong"],
      description: "Shows bot latency and status",
      permissions: null,
      module: "utilities",
      argsSchema: emptySchema,
      execute: async (ctx) => {
        const locale = await getLocaleForGuildId(ctx.guild.id);
        const t0 = Date.now();
        const api = Math.round(ctx.raw.client.ws.ping);

        let dbMs = null;
        try {
          const { prepare } = await import("../../../core/db/index.js");
          const s = Date.now();
          await prepare("SELECT 1").get();
          dbMs = Date.now() - s;
        } catch { }

        const up = process.uptime();
        const h = Math.floor(up / 3600);
        const m = Math.floor((up % 3600) / 60);
        const s = Math.floor(up % 60);
        const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        const embed = new EmbedBuilder()
          .setTitle(t(locale, "utilities.ping.title"))
          .addFields(
            { name: t(locale, "utilities.ping.fields.api"), value: `${api} ms`, inline: true },
            { name: t(locale, "utilities.ping.fields.round_trip"), value: `${Date.now() - t0} ms`, inline: true },
            { name: t(locale, "utilities.ping.fields.db"), value: dbMs !== null ? `${dbMs} ms` : t(locale, "utilities.ping.not_available"), inline: true },
            { name: t(locale, "utilities.ping.fields.uptime"), value: `${h}h ${m}m ${s}s`, inline: true },
            { name: t(locale, "utilities.ping.fields.memory"), value: `${mem} MB`, inline: true },
            { name: t(locale, "utilities.ping.fields.guilds"), value: `${ctx.raw.client.guilds.cache.size}`, inline: true }
          )
          .setColor(0x5865f2)
          .setTimestamp();

        return ctx.reply({ embeds: [embed] });
      }
    },
    {
      name: "help",
      aliases: ["ayuda", "commands"],
      description: "Shows available prefix commands",
      permissions: null,
      argsSchema: emptySchema,
      execute: async (ctx) => {
        const locale = await getLocaleForGuildId(ctx.guild.id);
        const { commandRegistry } = await import("../../../core/commands/commandRegistry.js");
        const commands = commandRegistry.getAllCommands();
        
        const moderationCommands = [];
        const utilityCommands = [];
        const infoCommands = [];
        
        for (const cmdName in commands) {
          const cmd = commands[cmdName];
          if (cmdName !== cmd.name) continue; // Skip aliases
          
          if (cmd.module === "moderation") {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            moderationCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          } else if (cmd.module === "utilities") {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            utilityCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          } else if (cmd.module === "info") {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            infoCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          }
        }
        
        const embed = new EmbedBuilder()
          .setTitle(t(locale, "utilities.prefix.help.title"))
          .setDescription(t(locale, "utilities.prefix.help.description"))
          .setColor(0x5865f2)
          .addFields(
            {
              name: t(locale, "utilities.prefix.help.fields.moderation"),
              value: moderationCommands.join("\n") || t(locale, "utilities.prefix.help.none"),
              inline: false
            },
            {
              name: t(locale, "utilities.prefix.help.fields.utilities"),
              value: utilityCommands.join("\n") || t(locale, "utilities.prefix.help.none"),
              inline: false
            },
            {
              name: t(locale, "utilities.prefix.help.fields.info"),
              value: infoCommands.join("\n") || t(locale, "utilities.prefix.help.none"),
              inline: false
            }
          )
          .setFooter({ text: t(locale, "utilities.prefix.help.footer") })
          .setTimestamp();
        
        return ctx.reply({ embeds: [embed] });
      }
    },
    {
      name: "config",
      aliases: ["cfg", "configuracion"],
      description: "Shows current server configuration",
      permissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles,
      module: "utilities",
      argsSchema: emptySchema,
      execute: async (ctx) => {
        const locale = await getLocaleForGuildId(ctx.guild.id);
        const { getSettings } = await import("../../../db.js");
        const { configEmbed } = await import("../ui/config.js");
        
        if (!ctx.member?.permissions.has(PermissionFlagsBits.ManageGuild) && 
            !ctx.member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return ctx.reply({ content: t(locale, "utilities.prefix.config.error_permission") });
        }
        
        const settings = (await getSettings.get(ctx.guild.id)) ?? {};
        const embed = await configEmbed(ctx.guild, settings, locale);
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

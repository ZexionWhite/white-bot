/**
 * Prefix command registrations para utilities
 */

import { z } from "zod";
import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import * as helpHandler from "../help.js";
import * as configHandler from "../config.js";

/**
 * Registra comandos de utilities para prefix
 */
export async function registerUtilitiesPrefixCommands() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  const emptySchema = z.object({}).transform(() => ({}));
  
  registerCommands([
    {
      name: "ping",
      aliases: [],
      description: "Mide latencia y estado del bot",
      permissions: null, // Sin permisos requeridos
      argsSchema: emptySchema,
      execute: async (ctx) => {
        // Para prefix, siempre mostramos público
        const embed = new (await import("discord.js")).EmbedBuilder()
          .setTitle("🏓 Pong")
          .addFields(
            { name: "API (WS)", value: `${Math.round(ctx.raw.client.ws.ping)} ms`, inline: true },
            { name: "Uptime", value: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`, inline: true },
            { name: "Memoria", value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
            { name: "Guilds", value: `${ctx.raw.client.guilds.cache.size}`, inline: true }
          )
          .setColor(0x5865f2)
          .setTimestamp();
        return ctx.reply({ embeds: [embed] });
      }
    },
    {
      name: "help",
      aliases: ["h", "ayuda"],
      description: "Muestra información sobre todos los comandos disponibles",
      permissions: null,
      argsSchema: emptySchema,
      execute: async (ctx) => {
        const { getAllCommands } = await import("../../../core/commands/commandRegistry.js");
        const { EmbedBuilder } = await import("discord.js");
        
        const allCommands = getAllCommands();
        
        // Agrupar comandos por categoría (basado en módulo de origen)
        const moderationCommands = [];
        const utilityCommands = [];
        const infoCommands = [];
        
        const moderationNames = new Set(["warn", "ban", "kick", "mute", "timeout", "tempban", "history", "case", "clear", "unban"]);
        const utilityNames = new Set(["ping", "help", "config"]);
        const infoNames = new Set(["user"]);
        
        for (const cmd of allCommands) {
          const cmdName = cmd.name.toLowerCase();
          if (moderationNames.has(cmdName)) {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            moderationCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          } else if (utilityNames.has(cmdName)) {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            utilityCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          } else if (infoNames.has(cmdName)) {
            const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (${cmd.aliases.join(", ")})` : "";
            infoCommands.push(`\`${cmdName}${aliases}\` - ${cmd.description || "Sin descripción"}`);
          }
        }
        
        const embed = new EmbedBuilder()
          .setTitle("📚 Comandos Prefix Disponibles")
          .setDescription("Todos los comandos disponibles usando el prefijo `capy!`")
          .setColor(0x5865f2)
          .addFields(
            {
              name: "🔨 Moderación",
              value: moderationCommands.join("\n") || "Ninguno",
              inline: false
            },
            {
              name: "🛠️ Utilidades",
              value: utilityCommands.join("\n") || "Ninguno",
              inline: false
            },
            {
              name: "ℹ️ Información",
              value: infoCommands.join("\n") || "Ninguno",
              inline: false
            }
          )
          .setFooter({ text: "Usa `/help` para ver información detallada de comandos slash" })
          .setTimestamp();
        
        return ctx.reply({ embeds: [embed] });
      }
    },
    {
      name: "config",
      aliases: ["cfg", "configuracion"],
      description: "Muestra la configuración actual del servidor",
      permissions: PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles,
      argsSchema: emptySchema,
      execute: async (ctx) => {
        const { getSettings } = await import("../../../db.js");
        const { configEmbed } = await import("../ui/config.js");
        
        if (!ctx.member?.permissions.has(PermissionFlagsBits.ManageGuild) && 
            !ctx.member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return ctx.reply({ content: "❌ No tienes permisos para ver la configuración." });
        }
        
        const settings = (await getSettings.get(ctx.guild.id)) ?? {};
        const embed = configEmbed(ctx.guild, settings);
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

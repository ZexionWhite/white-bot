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
        // Help command necesita una interaction, por ahora devolvemos mensaje simple
        return ctx.reply({ 
          content: "📚 **Comandos disponibles:**\n\n" +
                   "**Moderación:** `warn`, `ban`, `kick`, `mute`, `timeout`, `tempban`, `history`, `case`, `clear`, `unban`\n" +
                   "**Utilidades:** `ping`, `help`, `config`\n" +
                   "**Info:** `user`\n\n" +
                   "Usa `/help` para más información detallada."
        });
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
        
        const settings = getSettings.get(ctx.guild.id) ?? {};
        const embed = configEmbed(ctx.guild, settings);
        return ctx.reply({ embeds: [embed] });
      }
    }
  ]);
}

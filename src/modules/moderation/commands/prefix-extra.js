/**
 * Comandos adicionales de moderation para prefix
 * (history, case, clear, unban, etc - comandos que no usan modals)
 */

import { z } from "zod";
import { PermissionFlagsBits } from "discord.js";
import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createHistoryEmbed, createCaseEmbed, createErrorEmbed, createSuccessEmbed } from "../ui/embeds.js";
import { createPaginationComponents } from "../ui/components.js";

const CASES_PER_PAGE = 10;

/**
 * Registra comandos adicionales de moderation para prefix
 */
export async function registerModerationExtraPrefixCommands() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  const userSchema = z.object({
    rawArgs: z.array(z.string())
  }).transform((data) => {
    if (!data.rawArgs || data.rawArgs.length === 0) {
      throw new Error("Debes mencionar a un usuario o proporcionar su ID");
    }
    const input = data.rawArgs[0];
    const mentionMatch = input.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      return { userId: mentionMatch[1] };
    }
    if (/^\d+$/.test(input)) {
      return { userId: input };
    }
    throw new Error("Debes mencionar a un usuario o proporcionar su ID");
  });
  
  const caseIdSchema = z.object({
    rawArgs: z.array(z.string())
  }).transform((data) => {
    if (!data.rawArgs || data.rawArgs.length === 0) {
      throw new Error("Debes proporcionar el ID del caso");
    }
    const caseId = parseInt(data.rawArgs[0]);
    if (isNaN(caseId)) {
      throw new Error("El ID del caso debe ser un número");
    }
    return { caseId };
  });
  
  registerCommands([
    {
      name: "history",
      aliases: ["hist", "historial"],
      description: "Ver historial de sanciones de un usuario",
      permissions: PermissionFlagsBits.ModerateMembers,
      argsSchema: userSchema,
      execute: async (ctx) => {
        const { userId } = ctx.args;
        
        if (!await PermService.canExecuteCommand(ctx.member, "history")) {
          return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
        }
        
        const target = await ctx.raw.client.users.fetch(userId).catch(() => null);
        if (!target) {
          return ctx.reply({ content: "❌ Usuario no encontrado." });
        }
        
        const totalCases = await CasesService.countUserCases(ctx.guild.id, userId);
        const totalPages = Math.max(1, Math.ceil(totalCases / CASES_PER_PAGE));
        const page = 1;
        
        // Obtener casos paginados (10 por página)
        const cases = await CasesService.getUserCases(ctx.guild.id, userId, null, CASES_PER_PAGE, 0);

        // Obtener todos los casos para contar por tipo (sin paginación, solo para contar)
        const allCases = await CasesService.getUserCases(ctx.guild.id, userId, null, 10000, 0);
        
        // Contar por tipo
        const counts = {
          warned: 0,
          muted: 0,
          timeouted: 0,
          kicked: 0,
          banned: 0
        };

        allCases.forEach(c => {
          const caseType = c.type?.toUpperCase();
          if (caseType === "WARN") counts.warned++;
          else if (caseType === "MUTE") counts.muted++;
          else if (caseType === "TIMEOUT") counts.timeouted++;
          else if (caseType === "KICK") counts.kicked++;
          else if (caseType === "BAN" || caseType === "TEMPBAN" || caseType === "SOFTBAN") counts.banned++;
        });

        const embed = createHistoryEmbed(cases, target, page, totalPages, null, counts);
        const components = totalPages > 1 ? createPaginationComponents(page, totalPages, `history:${userId}:all`) : [];

        return ctx.reply({ embeds: [embed], components });
      }
    },
    {
      name: "case",
      aliases: ["caso"],
      description: "Ver un caso específico",
      permissions: PermissionFlagsBits.ModerateMembers,
      argsSchema: caseIdSchema,
      execute: async (ctx) => {
        const { caseId } = ctx.args;
        
        if (!await PermService.canExecuteCommand(ctx.member, "case")) {
          return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
        }
        
        const case_ = await CasesService.getCase(ctx.guild.id, caseId);
        if (!case_) {
          return ctx.reply({ embeds: [createErrorEmbed(`Case #${caseId} no encontrado`)] });
        }
        
        const target = await ctx.raw.client.users.fetch(case_.target_id).catch(() => ({ id: case_.target_id }));
        const moderator = await ctx.raw.client.users.fetch(case_.moderator_id).catch(() => ({ id: case_.moderator_id }));
        
        const embed = createCaseEmbed(case_, target, moderator);
        return ctx.reply({ embeds: [embed] });
      }
    },
    {
      name: "unban",
      aliases: ["ub"],
      description: "Desbanear a un usuario",
      permissions: PermissionFlagsBits.BanMembers,
      argsSchema: userSchema,
      execute: async (ctx) => {
        const { userId } = ctx.args;
        
        if (!await PermService.canExecuteCommand(ctx.member, "unban")) {
          return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
        }
        
        // Verificar que el usuario esté baneado
        const ban = await ctx.guild.bans.fetch(userId).catch(() => null);
        if (!ban) {
          return ctx.reply({ content: "❌ El usuario no está baneado." });
        }
        
        try {
          await ctx.guild.bans.remove(userId, "Unban aplicado");
        } catch (error) {
          return ctx.reply({ content: `❌ Error al desbanear: ${error.message}` });
        }
        
        const activeCases = await CasesService.getActiveCases(ctx.guild.id, userId);
        for (const case_ of activeCases) {
          if (case_.type === "BAN" || case_.type === "TEMPBAN") {
            await CasesService.deactivateCase(ctx.guild.id, case_.id);
          }
        }
        
        const case_ = await CasesService.createCase(
          ctx.guild.id,
          "UNBAN",
          userId,
          ctx.member.id,
          "Unban aplicado"
        );
        
        const ModlogService = await import("../services/modlog.service.js");
        const target = await ctx.raw.client.users.fetch(userId).catch(() => ({ id: userId }));
        await ModlogService.sendToModlog(ctx.guild, case_, target, ctx.member.user, null);
        
        return ctx.reply({ content: `✅ Usuario desbaneado. Case #${case_.id}` });
      }
    },
    {
      name: "clear",
      aliases: ["purge", "limpiar"],
      description: "Eliminar mensajes de un canal",
      permissions: PermissionFlagsBits.ManageMessages,
      argsSchema: z.object({
        rawArgs: z.array(z.string())
      }).transform((data) => {
        if (!data.rawArgs || data.rawArgs.length === 0) {
          throw new Error("Debes proporcionar la cantidad de mensajes (1-100)");
        }
        const amount = parseInt(data.rawArgs[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
          throw new Error("La cantidad debe ser un número entre 1 y 100");
        }
        const userId = data.rawArgs[1] ? (() => {
          const mentionMatch = data.rawArgs[1].match(/^<@!?(\d+)>$/);
          return mentionMatch ? mentionMatch[1] : (/^\d+$/.test(data.rawArgs[1]) ? data.rawArgs[1] : null);
        })() : null;
        return { amount, userId };
      }),
      execute: async (ctx) => {
        const { amount, userId } = ctx.args;
        
        if (!await PermService.canExecuteCommand(ctx.member, "clear")) {
          return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
        }
        
        if (!ctx.channel.isTextBased() || ctx.channel.isDMBased()) {
          return ctx.reply({ content: "❌ Este comando solo funciona en canales de texto." });
        }
        
        try {
          let deleted = 0;
          if (userId) {
            // Limpiar mensajes de un usuario específico
            const messages = await ctx.channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(m => m.author.id === userId && !m.pinned);
            const toDelete = Array.from(userMessages.values()).slice(0, amount);
            if (toDelete.length > 0) {
              await ctx.channel.bulkDelete(toDelete, true);
              deleted = toDelete.length;
            }
          } else {
            // Limpiar mensajes normales
            const messages = await ctx.channel.messages.fetch({ limit: amount + 1 });
            const toDelete = messages.filter(m => !m.pinned && (Date.now() - m.createdTimestamp) < 1209600000); // 14 días
            const actualDelete = Array.from(toDelete.values()).slice(0, amount);
            if (actualDelete.length > 0) {
              await ctx.channel.bulkDelete(actualDelete, true);
              deleted = actualDelete.length;
            }
          }
          
          // Crear caso para clear
          const CasesService = await import("../services/cases.service.js");
          const case_ = await CasesService.createCase(
            ctx.guild.id,
            "CLEAR",
            userId || "ALL",
            ctx.member.id,
            `Purge de ${deleted} mensajes en ${ctx.channel.name}`,
            null,
            { deletedCount: deleted, channelId: ctx.channel.id, channelName: ctx.channel.name }
          );
          
          return ctx.reply({ content: `✅ ${deleted} mensaje${deleted !== 1 ? "s" : ""} eliminado${deleted !== 1 ? "s" : ""}. Case #${case_.id}` });
        } catch (error) {
          return ctx.reply({ content: `❌ Error al limpiar mensajes: ${error.message}` });
        }
      }
    }
  ]);
}

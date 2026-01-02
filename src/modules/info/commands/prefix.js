/**
 * Prefix command registrations para info
 */

import { z } from "zod";
import * as PermService from "../../moderation/services/permissions.service.js";

/**
 * Registra comandos de info para prefix
 */
export async function registerInfoPrefixCommands() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  
  const userSchema = z.object({
    rawArgs: z.array(z.string())
  }).transform((data) => {
    if (!data.rawArgs || data.rawArgs.length === 0) {
      return { userId: null };
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
  
  registerCommands([
    {
      name: "user",
      aliases: ["userinfo", "info", "usuario"],
      description: "Información detallada de un usuario",
      permissions: null,
      argsSchema: userSchema,
      execute: async (ctx) => {
        const { userId } = ctx.args;
        const targetUser = userId 
          ? await ctx.raw.client.users.fetch(userId).catch(() => null)
          : ctx.raw.author;
        
        if (!targetUser) {
          return ctx.reply({ content: "❌ Usuario no encontrado." });
        }
        
        if (!await PermService.canExecuteCommand(ctx.member, "user")) {
          return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
        }
        
        const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
          return ctx.reply({ content: "❌ Usuario no encontrado en el servidor." });
        }
        
        const { createUserinfoOverview } = await import("../ui/embeds.js");
        const { createUserinfoSelectMenu } = await import("../../moderation/ui/components.js");
        
        const embed = createUserinfoOverview(targetMember, ctx.guild);
        const components = [createUserinfoSelectMenu(`user:${targetUser.id}`, "overview")];
        
        return ctx.reply({ embeds: [embed], components });
      }
    }
  ]);
}

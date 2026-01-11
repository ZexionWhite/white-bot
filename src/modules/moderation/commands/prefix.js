import { z } from "zod";
import { PermissionFlagsBits } from "discord.js";
import * as PermService from "../services/permissions.service.js";
import * as ModService from "../services/moderation.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import * as ModlogService from "../services/modlog.service.js";
import { createSanctionMessage } from "../ui/messages.js";
import { parseDuration } from "../../../utils/duration.js";
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";

function parseUser(input, guild) {
  if (!input) return null;

  const mentionMatch = input.match(/^<@!?(\d+)>$/);
  if (mentionMatch) {
    return mentionMatch[1];
  }

  if (/^\d+$/.test(input)) {
    return input;
  }
  
  return null;
}

function parsePrefixArgs(rawArgs) {
  if (!rawArgs || rawArgs.length === 0) {
    return { targetId: null, duration: null, reason: null };
  }
  
  const targetId = parseUser(rawArgs[0]);
  if (!targetId) {
    throw new Error("Debes mencionar a un usuario o proporcionar su ID");
  }
  
  let duration = null;
  let reasonStartIndex = 1;

  if (rawArgs.length > 1 && /^\d+[smhdwMy]$/.test(rawArgs[1])) {
    duration = parseDuration(rawArgs[1]);
    reasonStartIndex = 2;
  }

  const reason = rawArgs.slice(reasonStartIndex).join(" ").trim() || null;
  
  return { targetId, duration, reason };
}

async function executeModerationCommand(ctx, commandName, requireDuration = false) {
  const { targetId, duration, reason } = ctx.args;
  
  if (!targetId) {
    return ctx.reply({ content: "❌ Debes mencionar a un usuario o proporcionar su ID." });
  }
  
  if (!reason) {
    return ctx.reply({ 
      content: `❌ Debes proporcionar una razón.\nUso: \`capy!${commandName} <@usuario> [duración] <razón>\`` 
    });
  }
  
  if (requireDuration && !duration) {
    return ctx.reply({ 
      content: `❌ Debes proporcionar una duración.\nUso: \`capy!${commandName} <@usuario> <duración> <razón>\`` 
    });
  }
  
  const targetMember = await ctx.guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) {
    return ctx.reply({ content: "❌ Usuario no encontrado en el servidor." });
  }
  
  if (!await PermService.canExecuteCommand(ctx.member, commandName)) {
    return ctx.reply({ content: "❌ No tienes permisos para usar este comando." });
  }
  
  if (!PermService.canModerate(ctx.member, targetMember)) {
    return ctx.reply({ content: "❌ No puedes moderar a este usuario." });
  }
  
  let result;
  try {
    switch (commandName) {
      case "warn":
        result = await ModService.warn(ctx.guild, targetMember, ctx.member, reason);
        break;
      case "ban":
        result = await ModService.ban(ctx.guild, targetId, ctx.member, reason, 0);
        break;
      case "mute": {
        
        const settings = await SettingsRepo.getGuildSettings(ctx.guild.id);
        if (!settings.mute_role_id) {
          return ctx.reply({ content: `❌ ${t(locale, "common.prefix_commands.moderation.mute_role_not_set")}` });
        }
        const muteRole = await ctx.guild.roles.fetch(settings.mute_role_id).catch(() => null);
        if (!muteRole) {
          return ctx.reply({ content: `❌ ${t(locale, "common.prefix_commands.moderation.mute_role_not_found")}` });
        }
        result = await ModService.mute(ctx.guild, targetMember, ctx.member, reason, duration);
        break;
      }
      case "timeout":
        if (!duration) {
          return ctx.reply({ content: `❌ ${t(locale, "common.prefix_commands.moderation.timeout_duration_required")}` });
        }
        result = await ModService.timeout(ctx.guild, targetMember, ctx.member, reason, duration);
        break;
      case "kick":
        result = await ModService.kick(ctx.guild, targetMember, ctx.member, reason);
        break;
      case "tempban":
        if (!duration) {
          return ctx.reply({ content: `❌ ${t(locale, "common.prefix_commands.moderation.tempban_duration_required")}` });
        }
        result = await ModService.tempban(ctx.guild, targetId, ctx.member, reason, duration);
        break;
      default:
        return ctx.reply({ content: `❌ ${t(locale, "common.errors.command_not_implemented")}` });
    }
  } catch (error) {
    return ctx.reply({ content: `❌ Error: ${error.message}` });
  }

  if (result.case) {
    await ModlogService.sendToModlog(ctx.guild, result.case, targetMember.user, ctx.member.user, result.dmSent || null);
  }

  const message = createSanctionMessage(commandName, targetMember.user, result.case?.id);
  return ctx.reply({ content: message });
}

const moderationArgsSchema = z.object({
  rawArgs: z.array(z.string())
}).transform((data) => {
  const { targetId, duration, reason } = parsePrefixArgs(data.rawArgs);
  return { targetId, duration, reason };
});

export async function registerModerationPrefixCommands() {
  const { registerCommands } = await import("../../../core/commands/commandRegistry.js");
  const { z } = await import("zod");
  
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
      name: "warn",
      aliases: ["w"],
      description: "Advertir a un usuario",
      permissions: PermissionFlagsBits.ModerateMembers,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "warn", false)
    },
    {
      name: "ban",
      aliases: ["b"],
      description: "Banear a un usuario",
      permissions: PermissionFlagsBits.BanMembers,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "ban", false)
    },
    {
      name: "kick",
      aliases: ["k"],
      description: "Expulsar a un usuario",
      permissions: PermissionFlagsBits.KickMembers,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "kick", false)
    },
    {
      name: "mute",
      aliases: ["m"],
      description: "Mutear a un usuario",
      permissions: PermissionFlagsBits.ManageRoles,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "mute", false)
    },
    {
      name: "timeout",
      aliases: ["to"],
      description: "Aplicar timeout a un usuario",
      permissions: PermissionFlagsBits.ModerateMembers,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "timeout", true)
    },
    {
      name: "tempban",
      aliases: ["tb"],
      description: "Banear temporalmente a un usuario",
      permissions: PermissionFlagsBits.BanMembers,
      module: "moderation",
      argsSchema: moderationArgsSchema,
      execute: (ctx) => executeModerationCommand(ctx, "tempban", true)
    }
  ]);

  const { registerModerationExtraPrefixCommands } = await import("./prefix-extra.js");
  await registerModerationExtraPrefixCommands();
}

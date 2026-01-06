import * as ModService from "../services/moderation.service.js";
import * as PermService from "../services/permissions.service.js";
import * as CasesService from "../services/cases.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import * as ModlogService from "../services/modlog.service.js";
import { createModlogEmbed, createSuccessEmbed, createErrorEmbed, createCaseEmbed } from "../ui/embeds.js";
import { createSanctionMessage } from "../ui/messages.js";
import { sendLog } from "../../../core/webhooks/index.js";
import { getPendingAction, deletePendingAction, validateReason } from "./helpers.js";
import { parseDuration } from "../../../utils/duration.js";
import { log } from "../../../core/logger/index.js";
import { getLocaleForGuild } from "../../../core/i18n/index.js";

/**
 * Handles modal submission for moderation commands
 */
export async function handleModerationModal(itx) {
  const customId = itx.customId;
  
  // Parse customId: "pending:<actionId>"
  if (!customId.startsWith("pending:")) {
    return itx.reply({ 
      embeds: [createErrorEmbed("Invalid modal")], 
      ephemeral: true 
    });
  }

  const actionId = parseInt(customId.replace("pending:", ""));
  if (isNaN(actionId)) {
    return itx.reply({ 
      embeds: [createErrorEmbed("Invalid action ID")], 
      ephemeral: true 
    });
  }

  const pendingAction = await getPendingAction(actionId);
  if (!pendingAction) {
    return itx.reply({ 
      embeds: [createErrorEmbed("This action has expired or doesn't exist")], 
      ephemeral: true 
    });
  }

  // Verify author
  if (pendingAction.author_id !== itx.user.id) {
    return itx.reply({ 
      embeds: [createErrorEmbed("You didn't initiate this action")], 
      ephemeral: true 
    });
  }

  // Verify guild
  if (pendingAction.guild_id !== itx.guild.id) {
    return itx.reply({ 
      embeds: [createErrorEmbed("Invalid guild")], 
      ephemeral: true 
    });
  }

  const reason = itx.fields.getTextInputValue("reason");
  const validation = validateReason(reason);
  
  if (!validation.valid) {
    return itx.reply({ 
      embeds: [createErrorEmbed(validation.error)], 
      ephemeral: true 
    });
  }

  const { command, payload } = pendingAction;
  const validatedReason = validation.reason;

  // Delete pending action
  await deletePendingAction(actionId);

  // Route to appropriate handler
  try {
    switch (command) {
      case "warn":
        return await handleWarnModal(itx, payload, validatedReason);
      case "mute":
        return await handleMuteModal(itx, payload, validatedReason);
      case "unmute":
        return await handleUnmuteModal(itx, payload, validatedReason);
      case "timeout":
        return await handleTimeoutModal(itx, payload, validatedReason);
      case "untimeout":
        return await handleUntimeoutModal(itx, payload, validatedReason);
      case "kick":
        return await handleKickModal(itx, payload, validatedReason);
      case "ban":
        return await handleBanModal(itx, payload, validatedReason);
      case "tempban":
        return await handleTempbanModal(itx, payload, validatedReason);
      case "softban":
        return await handleSoftbanModal(itx, payload, validatedReason);
      case "unban":
        return await handleUnbanModal(itx, payload, validatedReason);
      case "editcase":
        return await handleEditCaseModal(itx, payload, validatedReason);
      default:
        return itx.reply({ 
          embeds: [createErrorEmbed(`Unknown command: ${command}`)], 
          ephemeral: true 
        });
    }
  } catch (error) {
    console.error(`[modal:${command}] Error:`, error);
    log.error("handleModerationModal", `Error en modal ${command}:`, error);
    
    // Si la interacción no ha sido respondida, responder con error
    if (itx.isRepliable() && !itx.replied && !itx.deferred) {
      try {
        return await itx.reply({ 
          embeds: [createErrorEmbed(`Ocurrió un error al procesar la acción. Por favor, intenta de nuevo.`)], 
          ephemeral: true 
        });
      } catch (replyError) {
        // Si falla, puede ser porque la interacción expiró (Unknown interaction)
        log.error("handleModerationModal", `Error al responder con mensaje de error (posible interacción expirada):`, replyError);
      }
    }
    return itx.reply({ 
      embeds: [createErrorEmbed(error.message || "An error occurred")], 
      ephemeral: true 
    });
  }
}

async function handleWarnModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "warn")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.warn(itx.guild, target, moderator, reason);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("warn", target.user, case_.id) });
}

async function handleMuteModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "mute")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (!settings.mute_role_id) {
    return itx.reply({ embeds: [createErrorEmbed("No mute role configured. Use /createmuterole or /setmuterole")], ephemeral: true });
  }

  const muteRole = await itx.guild.roles.fetch(settings.mute_role_id).catch(() => null);
  if (!muteRole) {
    return itx.reply({ embeds: [createErrorEmbed("The configured mute role doesn't exist")], ephemeral: true });
  }

  const botMember = await itx.guild.members.fetchMe();
  if (!PermService.canManageRole(botMember, muteRole)) {
    return itx.reply({ embeds: [createErrorEmbed("The bot cannot manage the mute role. Check role hierarchy")], ephemeral: true });
  }

  const duration = payload.durationMs ? payload.durationMs : null;

  const { case: case_, dmSent } = await ModService.mute(itx.guild, target, moderator, reason, duration);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("mute", target.user, case_.id) });
}

async function handleUnmuteModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "unmute")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (!settings.mute_role_id) {
    const locale = await getLocaleForGuild(itx.guild);
    return itx.reply({ embeds: [createErrorEmbed("No mute role configured", locale)], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.unmute(itx.guild, target, moderator, reason);

  if (settings.modlog_channel_id) {
    const modlogChannel = await itx.guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
    if (modlogChannel) {
      const locale = await getLocaleForGuild(itx.guild);
      const embed = createModlogEmbed(case_, target.user, itx.user, dmSent, locale);
      await sendLog(modlogChannel, { embeds: [embed] }, "moderation");
    }
  }

  return itx.reply({ content: createSanctionMessage("unmute", target.user, case_.id) });
}

async function handleTimeoutModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "timeout")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const duration = payload.durationMs;
  if (!duration) {
    return itx.reply({ embeds: [createErrorEmbed("Duration is required")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.timeout(itx.guild, target, moderator, reason, duration);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("timeout", target.user, case_.id) });
}

async function handleUntimeoutModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "untimeout")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.untimeout(itx.guild, target, moderator, reason);

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (settings.modlog_channel_id) {
    const modlogChannel = await itx.guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
    if (modlogChannel) {
      const locale = await getLocaleForGuild(itx.guild);
      const embed = createModlogEmbed(case_, target.user, itx.user, dmSent, locale);
      await sendLog(modlogChannel, { embeds: [embed] }, "moderation");
    }
  }

  return itx.reply({ content: createSanctionMessage("untimeout", target.user, case_.id) });
}

async function handleKickModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "kick")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.kick(itx.guild, target, moderator, reason);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("kick", target.user, case_.id) });
}

async function handleBanModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "ban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const deleteDays = payload.deleteDays || 0;

  const { case: case_, dmSent } = await ModService.ban(itx.guild, target.id, moderator, reason, deleteDays);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("ban", target.user, case_.id) });
}

async function handleTempbanModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "tempban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const duration = payload.durationMs;
  if (!duration) {
    return itx.reply({ embeds: [createErrorEmbed("Duration is required")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.tempban(itx.guild, payload.targetId, moderator, reason, duration);

  await ModlogService.sendToModlog(itx.guild, case_, target.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("tempban", target.user, case_.id) });
}

async function handleSoftbanModal(itx, payload, reason) {
  const target = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "softban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(moderator, target)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const deleteDays = payload.deleteDays || 0;

  const { case: case_ } = await ModService.softban(itx.guild, payload.targetId, moderator, reason, deleteDays);

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (settings.modlog_channel_id) {
    const modlogChannel = await itx.guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
    if (modlogChannel) {
      const locale = await getLocaleForGuild(itx.guild);
      const embed = createModlogEmbed(case_, target.user, itx.user, null, locale);
      await sendLog(modlogChannel, { embeds: [embed] }, "moderation");
    }
  }

  return itx.reply({ content: createSanctionMessage("softban", target.user, case_.id) });
}

async function handleUnbanModal(itx, payload, reason) {
  const targetId = payload.targetId;
  
  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "unban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const ban = await itx.guild.bans.fetch(targetId).catch(() => null);
  if (!ban) {
    return itx.reply({ embeds: [createErrorEmbed("User is not banned")], ephemeral: true });
  }

  const { case: case_, dmSent } = await ModService.unban(itx.guild, targetId, moderator, reason);

  await ModlogService.sendToModlog(itx.guild, case_, ban.user, itx.user, dmSent);

  return itx.reply({ content: createSanctionMessage("unban", { id: targetId }, case_.id) });
}

async function handleEditCaseModal(itx, payload, reason) {
  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "editcase")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const case_ = await CasesService.getCase(itx.guild.id, payload.caseId);
  if (!case_) {
    return itx.reply({ embeds: [createErrorEmbed(`Case #${payload.caseId} not found`)], ephemeral: true });
  }

  const updated = await CasesService.updateCase(itx.guild.id, payload.caseId, reason);

  const locale = await getLocaleForGuild(itx.guild);
  const target = await itx.client.users.fetch(updated.target_id).catch(() => ({ id: updated.target_id }));
  const originalModerator = await itx.client.users.fetch(updated.moderator_id).catch(() => ({ id: updated.moderator_id }));

  const embed = createCaseEmbed(updated, target, originalModerator, locale);

  return itx.reply({ embeds: [createSuccessEmbed("Case updated", { id: updated.target_id }, payload.caseId, locale), embed], ephemeral: true });
}

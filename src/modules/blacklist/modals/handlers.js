import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import * as SettingsRepo from "../../moderation/db/settings.repo.js";
import { createBlacklistEmbed, createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";
import { getPendingAction, deletePendingAction, validateReason } from "../../moderation/modals/helpers.js";

/**
 * Handles modal submission for blacklist commands
 */
export async function handleBlacklistModal(itx) {
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
  const evidence = itx.fields.getTextInputValue("evidence")?.trim() || null;

  // Delete pending action
  await deletePendingAction(actionId);

  // Route to appropriate handler
  try {
    switch (command) {
      case "blacklist.add":
        return await handleBlacklistAddModal(itx, payload, validatedReason, evidence);
      case "blacklist.edit":
        return await handleBlacklistEditModal(itx, payload, validatedReason, evidence);
      default:
        return itx.reply({ 
          embeds: [createErrorEmbed(`Unknown command: ${command}`)], 
          ephemeral: true 
        });
    }
  } catch (error) {
    console.error(`[modal:${command}] Error:`, error);
    return itx.reply({ 
      embeds: [createErrorEmbed(error.message || "An error occurred")], 
      ephemeral: true 
    });
  }
}

async function handleBlacklistAddModal(itx, payload, reason, evidence) {
  const target = await itx.client.users.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed("User not found")], ephemeral: true });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "blacklist.add")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const targetMember = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (targetMember && !PermService.canModerate(moderator, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const severity = payload.severity || "MEDIUM";

  const entry = BlacklistService.createEntry(
    itx.guild.id,
    payload.targetId,
    itx.user.id,
    reason,
    evidence,
    severity
  );

  const settings = SettingsRepo.getGuildSettings(itx.guild.id);
  
  if (settings.blacklist_channel_id) {
    const blacklistChannel = await itx.guild.channels.fetch(settings.blacklist_channel_id).catch(() => null);
    if (blacklistChannel) {
      const embed = createBlacklistEmbed(entry, target, itx.user);
      await blacklistChannel.send({ embeds: [embed] });
    }
  }

  return itx.reply({ embeds: [createSuccessEmbed(`User added to blacklist (Entry #${entry.id})`)] });
}

async function handleBlacklistEditModal(itx, payload, reason, evidence) {
  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "blacklist.edit")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const entry = BlacklistService.getEntry(itx.guild.id, payload.caseId);
  if (!entry) {
    return itx.reply({ embeds: [createErrorEmbed(`Entry #${payload.caseId} not found`)], ephemeral: true });
  }

  const updated = BlacklistService.updateEntry(
    itx.guild.id,
    payload.caseId,
    itx.user.id,
    reason,
    evidence,
    payload.severity ? payload.severity.toUpperCase() : null
  );

  const target = await itx.client.users.fetch(updated.user_id).catch(() => ({ id: updated.user_id }));
  const originalModerator = await itx.client.users.fetch(updated.moderator_id).catch(() => ({ id: updated.moderator_id }));

  const embed = createBlacklistEmbed(updated, target, originalModerator);

  const settings = SettingsRepo.getGuildSettings(itx.guild.id);
  if (settings.blacklist_channel_id) {
    const blacklistChannel = await itx.guild.channels.fetch(settings.blacklist_channel_id).catch(() => null);
    if (blacklistChannel) {
      await blacklistChannel.send({ embeds: [embed] });
    }
  }

  return itx.reply({ embeds: [createSuccessEmbed(`Entry #${payload.caseId} updated`), embed], ephemeral: true });
}

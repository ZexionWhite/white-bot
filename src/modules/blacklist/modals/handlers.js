import { AttachmentBuilder, MessageFlags } from "discord.js";
import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import * as SettingsRepo from "../../moderation/db/settings.repo.js";
import { createBlacklistEmbed, createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";
import { getPendingAction, deletePendingAction, validateReason } from "../../moderation/modals/helpers.js";
import { log } from "../../../core/logger/index.js";
import { sendLog } from "../../../core/webhooks/index.js";
import { getLocaleForGuild, t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

/**
 * Handles modal submission for blacklist commands
 */
export async function handleBlacklistModal(itx) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  const customId = itx.customId;
  
  // Parse customId: "pending:<actionId>"
  if (!customId.startsWith("pending:")) {
    return itx.reply({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.invalid_modal"), locale)], 
      flags: MessageFlags.Ephemeral 
    });
  }

  const actionId = parseInt(customId.replace("pending:", ""));
  if (isNaN(actionId)) {
    return itx.reply({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.invalid_action_id"), locale)], 
      flags: MessageFlags.Ephemeral 
    });
  }

  const pendingAction = await getPendingAction(actionId);
  if (!pendingAction) {
    return itx.reply({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.action_expired"), locale)], 
      flags: MessageFlags.Ephemeral 
    });
  }

  // Verify author
  if (pendingAction.author_id !== itx.user.id) {
    return itx.reply({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.not_author"), locale)], 
      flags: MessageFlags.Ephemeral 
    });
  }

  // Verify guild
  if (pendingAction.guild_id !== itx.guild.id) {
    return itx.reply({ 
      embeds: [createErrorEmbed(t(locale, "common.errors.invalid_guild"), locale)], 
      flags: MessageFlags.Ephemeral 
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
      case "blacklist.add":
        return await handleBlacklistAddModal(itx, payload, validatedReason);
      case "blacklist.edit":
        return await handleBlacklistEditModal(itx, payload, validatedReason);
      default:
        return itx.reply({ 
          embeds: [createErrorEmbed(`Unknown command: ${command}`)], 
          ephemeral: true 
        });
    }
  } catch (error) {
    log.error("handleBlacklistModal", `Error en modal ${command}:`, error);
    console.error(`[modal:${command}] Error:`, error);
    
    // Si la interacción no ha sido respondida, responder con error
    if (itx.isRepliable() && !itx.replied && !itx.deferred) {
      try {
        return await itx.reply({ 
          embeds: [createErrorEmbed(`Ocurrió un error al procesar la acción. Por favor, intenta de nuevo.`)], 
          ephemeral: true 
        });
      } catch (replyError) {
        // Si falla, puede ser porque la interacción expiró (Unknown interaction)
        log.error("handleBlacklistModal", `Error al responder con mensaje de error (posible interacción expirada):`, replyError);
      }
    }
  }
}

async function handleBlacklistAddModal(itx, payload, reason) {
  const locale = await getLocaleForGuild(itx.guild);
  
  // Validaciones de seguridad
  const target = await itx.client.users.fetch(payload.targetId).catch(() => null);
  if (!target) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.user_not_found"), locale)], flags: MessageFlags.Ephemeral });
  }

  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "blacklist.add")) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.permission_denied"), locale)], flags: MessageFlags.Ephemeral });
  }

  const targetMember = await itx.guild.members.fetch(payload.targetId).catch(() => null);
  if (targetMember && !PermService.canModerate(moderator, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.cannot_moderate"), locale)], flags: MessageFlags.Ephemeral });
  }

  const severity = payload.severity || "MEDIUM";

  // Crear entrada sin evidence (ya no se guarda en DB)
  const entry = await BlacklistService.createEntry(
    itx.guild.id,
    payload.targetId,
    itx.user.id,
    reason,
    null, // evidence ya no se guarda en DB
    severity
  );

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  
  if (settings.blacklist_channel_id) {
    const blacklistChannel = await itx.guild.channels.fetch(settings.blacklist_channel_id).catch(() => null);
    if (blacklistChannel && blacklistChannel.isTextBased()) {
      // Enviar embed principal
      const embed = createBlacklistEmbed(entry, target, itx.user);
      await sendLog(blacklistChannel, { embeds: [embed] }, "blacklist");

      // Si hay archivo adjunto, reenviarlo por separado (sin guardar en DB)
      if (payload.evidenceAttachmentUrl) {
        try {
          const response = await fetch(payload.evidenceAttachmentUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const attachment = new AttachmentBuilder(buffer, { name: payload.evidenceAttachmentName || "evidence" });
            await sendLog(blacklistChannel, {
              content: `**Evidence for Entry #${entry.id}**`,
              files: [attachment]
            }, "blacklist");
          }
        } catch (error) {
          // Si falla la descarga/reenvío, solo loguear el error pero no fallar la operación
          log.warn("blacklist", `Error al reenviar archivo de evidencia:`, error.message);
        }
      }
    }
  }

  return itx.reply({ embeds: [createSuccessEmbed(t(locale, "blacklist.embeds.success.created"), target, entry.id, locale)] });
}

async function handleBlacklistEditModal(itx, payload, reason) {
  // Validaciones de seguridad
  const moderator = await itx.guild.members.fetch(itx.user.id);
  if (!await PermService.canExecuteCommand(moderator, "blacklist.edit")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const entry = await BlacklistService.getEntry(itx.guild.id, payload.caseId);
  if (!entry) {
    return itx.reply({ embeds: [createErrorEmbed(`Entry #${payload.caseId} not found`)], ephemeral: true });
  }

  // Actualizar entrada sin evidence (ya no se guarda en DB)
  const updated = await BlacklistService.updateEntry(
    itx.guild.id,
    payload.caseId,
    itx.user.id,
    reason,
    null, // evidence ya no se guarda en DB
    payload.severity ? payload.severity.toUpperCase() : null
  );

  const target = await itx.client.users.fetch(updated.user_id).catch(() => ({ id: updated.user_id }));
  const originalModerator = await itx.client.users.fetch(updated.moderator_id).catch(() => ({ id: updated.moderator_id }));

  const embed = createBlacklistEmbed(updated, target, originalModerator, locale);

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (settings.blacklist_channel_id) {
    const blacklistChannel = await itx.guild.channels.fetch(settings.blacklist_channel_id).catch(() => null);
    if (blacklistChannel && blacklistChannel.isTextBased()) {
      await sendLog(blacklistChannel, { embeds: [embed] }, "blacklist");
    }
  }

  return itx.reply({ embeds: [createSuccessEmbed(t(locale, "common.success.operation_complete"), null, null, locale), embed], flags: MessageFlags.Ephemeral });
}

import * as PermService from "../services/permissions.service.js";
import { parseDuration } from "../../../utils/duration.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);
  const durationStr = itx.options.getString("duration", true);

  const duration = parseDuration(durationStr);
  if (!duration) {
    return itx.reply({ embeds: [createErrorEmbed("Invalid duration. Use format: 10m, 2h, 3d")], ephemeral: true });
  }

  if (duration < 1000 || duration > 28 * 24 * 60 * 60 * 1000) {
    return itx.reply({ embeds: [createErrorEmbed("Duration must be between 1 second and 28 days")], ephemeral: true });
  }

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (!targetMember) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "timeout")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId: target.id, durationMs: duration };
    const actionId = await createPendingAction(itx.guild.id, itx.user.id, "timeout", payload);

  // Create and show modal
  const modal = createReasonModal("timeout", "Timeout: Reason", `pending:${actionId}`, "Explain briefly what happened...");
  
  return itx.showModal(modal);
}


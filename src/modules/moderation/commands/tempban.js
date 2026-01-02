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

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);

  if (targetMember && !PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "tempban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId: target.id, durationMs: duration };
  const actionId = await createPendingAction(itx.guild.id, itx.user.id, "tempban", payload);

  // Create and show modal
  const modal = createReasonModal("tempban", "Tempban: Reason", `pending:${actionId}`, "Explain briefly what happened...");
  
  return itx.showModal(modal);
}


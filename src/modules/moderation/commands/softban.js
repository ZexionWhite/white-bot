import * as PermService from "../services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);
  const deleteDays = itx.options.getInteger("deletedays") || 1;

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);

  if (targetMember && !PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "softban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId: target.id, deleteDays };
  const actionId = await createPendingAction(itx.guild.id, itx.user.id, "softban", payload);

  // Create and show modal
  const modal = createReasonModal("softban", "Softban: Reason", `pending:${actionId}`, "Explain briefly what happened...");
  
  return itx.showModal(modal);
}


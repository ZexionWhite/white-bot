import * as PermService from "../services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const targetId = itx.options.getString("user", true);

  if (!await PermService.canExecuteCommand(itx.member, "unban")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const ban = await itx.guild.bans.fetch(targetId).catch(() => null);
  if (!ban) {
    return itx.reply({ embeds: [createErrorEmbed("User is not banned")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId };
  const actionId = await createPendingAction(itx.guild.id, itx.user.id, "unban", payload);

  // Create and show modal
  const modal = createReasonModal("unban", "Unban: Reason", `pending:${actionId}`, "Explain briefly why you're unbanning this user...");
  
  return itx.showModal(modal);
}


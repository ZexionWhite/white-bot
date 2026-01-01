import * as PermService from "../../moderation/services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction } from "../../moderation/modals/helpers.js";
import { createBlacklistModal } from "../../moderation/modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);
  const severity = itx.options.getString("severity") || "MEDIUM";

  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity.toUpperCase())) {
    return itx.reply({ embeds: [createErrorEmbed("Invalid severity. Use: LOW, MEDIUM, HIGH, CRITICAL")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "blacklist.add")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (targetMember && !PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId: target.id, severity: severity.toUpperCase() };
  const actionId = createPendingAction(itx.guild.id, itx.user.id, "blacklist.add", payload);

  // Create and show modal
  const modal = createBlacklistModal(`pending:${actionId}`, false);
  
  return itx.showModal(modal);
}


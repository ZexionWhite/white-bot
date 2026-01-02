import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction } from "../../moderation/modals/helpers.js";
import { createBlacklistModal } from "../../moderation/modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const caseId = itx.options.getInteger("caseid", true);
  const newSeverity = itx.options.getString("newseverity");

  if (newSeverity && !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(newSeverity.toUpperCase())) {
    return itx.reply({ embeds: [createErrorEmbed("Invalid severity. Use: LOW, MEDIUM, HIGH, CRITICAL")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "blacklist.edit")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const entry = BlacklistService.getEntry(itx.guild.id, caseId);
  if (!entry) {
    return itx.reply({ embeds: [createErrorEmbed(`Entry #${caseId} not found`)], ephemeral: true });
  }

  // Create pending action
  const payload = { caseId, severity: newSeverity ? newSeverity.toUpperCase() : null };
  const actionId = await createPendingAction(itx.guild.id, itx.user.id, "blacklist.edit", payload);

  // Create and show modal
  const modal = createBlacklistModal(`pending:${actionId}`, true);
  
  return itx.showModal(modal);
}


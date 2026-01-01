import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const caseId = itx.options.getInteger("id", true);

  if (!await PermService.canExecuteCommand(itx.member, "editcase")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const case_ = CasesService.getCase(itx.guild.id, caseId);
  if (!case_) {
    return itx.reply({ embeds: [createErrorEmbed(`Case #${caseId} not found`)], ephemeral: true });
  }

  // Create pending action
  const payload = { caseId };
  const actionId = createPendingAction(itx.guild.id, itx.user.id, "editcase", payload);

  // Create and show modal
  const modal = createReasonModal("editcase", "Edit Case: New Reason", `pending:${actionId}`, "Enter the new reason for this case...");
  
  return itx.showModal(modal);
}


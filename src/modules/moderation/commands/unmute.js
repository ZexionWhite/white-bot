import * as PermService from "../services/permissions.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (!targetMember) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "unmute")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const settings = SettingsRepo.getGuildSettings(itx.guild.id);
  if (!settings.mute_role_id) {
    return itx.reply({ embeds: [createErrorEmbed("No mute role configured")], ephemeral: true });
  }

  // Create pending action
  const payload = { targetId: target.id };
  const actionId = createPendingAction(itx.guild.id, itx.user.id, "unmute", payload);

  // Create and show modal
  const modal = createReasonModal("unmute", "Unmute: Reason", `pending:${actionId}`, "Explain briefly why you're unmuting this user...");
  
  return itx.showModal(modal);
}


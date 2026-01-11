import * as PermService from "../services/permissions.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import { parseDuration } from "../../../utils/duration.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { createPendingAction, createReasonModal } from "../modals/helpers.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);
  const durationStr = itx.options.getString("duration");

  const duration = durationStr ? parseDuration(durationStr) : null;
  if (durationStr && !duration) {
    return itx.reply({ embeds: [createErrorEmbed("Invalid duration. Use format: 10m, 2h, 3d")], ephemeral: true });
  }

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (!targetMember) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "mute")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  if (!PermService.canModerate(itx.member, targetMember)) {
    return itx.reply({ embeds: [createErrorEmbed("You cannot moderate this user")], ephemeral: true });
  }

  const settings = await SettingsRepo.getGuildSettings(itx.guild.id);
  if (!settings.mute_role_id) {
    return itx.reply({ embeds: [createErrorEmbed("No mute role configured. Use /createmuterole or /setmuterole")], ephemeral: true });
  }

  const muteRole = await itx.guild.roles.fetch(settings.mute_role_id).catch(() => null);
  if (!muteRole) {
    return itx.reply({ embeds: [createErrorEmbed("The configured mute role doesn't exist")], ephemeral: true });
  }

  const botMember = await itx.guild.members.fetchMe();
  if (!PermService.canManageRole(botMember, muteRole)) {
    return itx.reply({ embeds: [createErrorEmbed("The bot cannot manage the mute role. Check role hierarchy")], ephemeral: true });
  }

  const payload = { targetId: target.id, durationMs: duration };
    const actionId = await createPendingAction(itx.guild.id, itx.user.id, "mute", payload);

  const modal = createReasonModal("mute", "Mute: Reason", `pending:${actionId}`, "Explain briefly what happened...");
  
  return itx.showModal(modal);
}

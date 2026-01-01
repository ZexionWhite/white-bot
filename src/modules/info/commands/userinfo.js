import * as PermService from "../../moderation/services/permissions.service.js";
import { createUserinfoOverview, createUserinfoSanctions, createUserinfoVoice, createUserinfoMessages, createUserinfoPermissions, createUserinfoStatistics } from "../ui/embeds.js";
import { createUserinfoSelectMenu } from "../../moderation/ui/components.js";
import { createErrorEmbed } from "../../moderation/ui/embeds.js";
import { getUserStats } from "../../../db.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "This command only works in servers.", ephemeral: true });
  }

  const target = itx.options.getUser("user") || itx.user;

  if (!await PermService.canExecuteCommand(itx.member, "user")) {
    return itx.reply({ embeds: [createErrorEmbed("You don't have permission to use this command")], ephemeral: true });
  }

  const targetMember = await itx.guild.members.fetch(target.id).catch(() => null);
  if (!targetMember) {
    return itx.reply({ embeds: [createErrorEmbed("User not found in server")], ephemeral: true });
  }

  const embed = createUserinfoOverview(targetMember, itx.guild);
  const components = [createUserinfoSelectMenu(`user:${target.id}`, "overview")];

  return itx.reply({ embeds: [embed], components, ephemeral: false });
}

export async function handleSelectMenu(itx, targetId, view) {
  const targetMember = await itx.guild.members.fetch(targetId).catch(() => null);
  if (!targetMember) {
    return itx.update({ embeds: [createErrorEmbed("User not found")], components: [] });
  }

  let embed;
  switch (view) {
    case "overview":
      embed = createUserinfoOverview(targetMember, itx.guild);
      break;
    case "sanctions":
      embed = createUserinfoSanctions(targetMember, itx.guild);
      break;
    case "voice":
      embed = createUserinfoVoice(targetMember, itx.guild);
      break;
    case "messages":
      embed = createUserinfoMessages(targetMember, itx.guild);
      break;
    case "permissions":
      embed = createUserinfoPermissions(targetMember, itx.guild);
      break;
    case "statistics":
      const stats = getUserStats.get(itx.guild.id, targetMember.id) ?? null;
      embed = createUserinfoStatistics(targetMember, stats);
      break;
    default:
      embed = createUserinfoOverview(targetMember, itx.guild);
  }

  const components = [createUserinfoSelectMenu(`user:${targetId}`, view)];

  return itx.update({ embeds: [embed], components });
}


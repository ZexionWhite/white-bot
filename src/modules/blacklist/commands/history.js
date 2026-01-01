import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createBlacklistHistoryEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);

  if (!await PermService.canExecuteCommand(itx.member, "blacklist.history")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const entries = BlacklistService.getUserEntries(itx.guild.id, target.id);
  const embed = createBlacklistHistoryEmbed(entries, target);

  return itx.reply({ embeds: [embed], ephemeral: true });
}


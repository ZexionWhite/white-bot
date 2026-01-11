import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const caseId = itx.options.getInteger("caseid", true);
  const reason = itx.options.getString("reason") || "Sin razón especificada";

  if (!await PermService.canExecuteCommand(itx.member, "blacklist.remove")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const entry = await BlacklistService.getEntry(itx.guild.id, caseId);
  if (!entry) {
    return itx.reply({ embeds: [createErrorEmbed(`Entry #${caseId} no encontrado`)], ephemeral: true });
  }

  await BlacklistService.deleteEntry(itx.guild.id, caseId, itx.user.id, reason);

  return itx.reply({ embeds: [createSuccessEmbed(`Entry #${caseId} eliminado`)] });
}

import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const caseId = itx.options.getInteger("id", true);
  const reason = itx.options.getString("reason") || "Sin razón especificada";

  if (!await PermService.canExecuteCommand(itx.member, "remove")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const case_ = await CasesService.getCase(itx.guild.id, caseId);
  if (!case_) {
    return itx.reply({ embeds: [createErrorEmbed(`Case #${caseId} no encontrado`)], ephemeral: true });
  }

  await CasesService.deleteCase(itx.guild.id, caseId, itx.user.id, reason);

  return itx.reply({ embeds: [createSuccessEmbed("Case eliminado", { id: case_.target_id }, caseId)] });
}


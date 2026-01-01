import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createCaseEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const caseId = itx.options.getInteger("id", true);

  if (!await PermService.canExecuteCommand(itx.member, "case")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const case_ = CasesService.getCase(itx.guild.id, caseId);
  if (!case_) {
    return itx.reply({ embeds: [createErrorEmbed(`Case #${caseId} no encontrado`)], ephemeral: true });
  }

  const target = await itx.client.users.fetch(case_.target_id).catch(() => ({ id: case_.target_id }));
  const moderator = await itx.client.users.fetch(case_.moderator_id).catch(() => ({ id: case_.moderator_id }));

  const embed = createCaseEmbed(case_, target, moderator);

  return itx.reply({ embeds: [embed] });
}


import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createHistoryEmbed, createErrorEmbed } from "../ui/embeds.js";
import { createPaginationComponents } from "../ui/components.js";

const CASES_PER_PAGE = 10;

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const target = itx.options.getUser("user", true);

  if (!await PermService.canExecuteCommand(itx.member, "history")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const totalCases = await CasesService.countUserCases(itx.guild.id, target.id);
  const totalPages = Math.max(1, Math.ceil(totalCases / CASES_PER_PAGE));
  const page = 1;

  // Obtener casos paginados (10 por página)
  const cases = await CasesService.getUserCases(itx.guild.id, target.id, null, CASES_PER_PAGE, 0);

  // Obtener todos los casos para contar por tipo (sin paginación, solo para contar)
  const allCases = await CasesService.getUserCases(itx.guild.id, target.id, null, 10000, 0);
  
  // Contar por tipo
  const counts = {
    warned: 0,
    muted: 0,
    timeouted: 0,
    kicked: 0,
    banned: 0
  };

  allCases.forEach(c => {
    const caseType = c.type?.toUpperCase();
    if (caseType === "WARN") counts.warned++;
    else if (caseType === "MUTE") counts.muted++;
    else if (caseType === "TIMEOUT") counts.timeouted++;
    else if (caseType === "KICK") counts.kicked++;
    else if (caseType === "BAN" || caseType === "TEMPBAN" || caseType === "SOFTBAN") counts.banned++;
  });

  const embed = createHistoryEmbed(cases, target, page, totalPages, null, counts);
  const components = totalPages > 1 ? createPaginationComponents(page, totalPages, `history:${target.id}:all`) : [];

  return itx.reply({ embeds: [embed], components });
}


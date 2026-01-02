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
  const type = itx.options.getString("type");
  const limit = Math.min(itx.options.getInteger("limit") || 10, 50);

  if (!await PermService.canExecuteCommand(itx.member, "history")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const totalCases = await CasesService.countUserCases(itx.guild.id, target.id);
  const totalPages = Math.max(1, Math.ceil(totalCases / CASES_PER_PAGE));
  const page = 1;

  const cases = await CasesService.getUserCases(itx.guild.id, target.id, type, CASES_PER_PAGE, 0);

  const embed = createHistoryEmbed(cases, target, page, totalPages, type);
  const components = totalPages > 1 ? createPaginationComponents(page, totalPages, `history:${target.id}:${type || "all"}`) : [];

  return itx.reply({ embeds: [embed], components });
}


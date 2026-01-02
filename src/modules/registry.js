import { moderationSlashCommands } from "./moderation/slash.js";
import { blacklistSlashCommands } from "./blacklist/slash.js";
import { infoSlashCommands } from "./info/slash.js";
import { permissionsSlashCommands } from "./permissions/slash.js";
import { autorolesSlashCommands } from "./autoroles/slash.js";
import { settingsSlashCommands } from "./settings/slash.js";
import { utilitiesSlashCommands } from "./utilities/slash.js";
import { moderationHandlers } from "./moderation/router.js";
import { blacklistHandlers } from "./blacklist/router.js";
import { infoHandlers, infoComponentHandlers } from "./info/router.js";
import { permissionsHandlers, permissionsAutocompleteHandlers } from "./permissions/router.js";
import { autorolesHandlers, autorolesComponentHandlers } from "./autoroles/router.js";
import { settingsHandlers } from "./settings/router.js";
import { utilitiesHandlers, utilitiesComponentHandlers } from "./utilities/router.js";
import * as userinfo from "./info/commands/userinfo.js";

export const allSlashCommands = [
  ...moderationSlashCommands,
  ...blacklistSlashCommands,
  ...infoSlashCommands,
  ...permissionsSlashCommands,
  ...autorolesSlashCommands,
  ...settingsSlashCommands,
  ...utilitiesSlashCommands
];

export const commandHandlers = {
  ...moderationHandlers,
  ...blacklistHandlers,
  ...infoHandlers,
  ...permissionsHandlers,
  ...autorolesHandlers,
  ...settingsHandlers,
  ...utilitiesHandlers
};

export const autocompleteHandlers = {
  ...permissionsAutocompleteHandlers
};

export const componentHandlers = {
  ...infoComponentHandlers,
  ...autorolesComponentHandlers,
  ...utilitiesComponentHandlers,
  history: async (itx, customId) => {
    const [_, userId, type, action, page] = customId.split(":");
    const newPage = action === "next" ? parseInt(page) + 1 : parseInt(page) - 1;
    const CasesService = await import("./moderation/services/cases.service.js");
    
    // Obtener casos paginados (10 por página)
    const cases = await CasesService.getUserCases(itx.guild.id, userId, type === "all" ? null : type, 10, (newPage - 1) * 10);
    
    // Obtener todos los casos para contar por tipo (sin paginación, solo para contar)
    const allCases = await CasesService.getUserCases(itx.guild.id, userId, null, 10000, 0);
    
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
    
    const totalCases = await CasesService.countUserCases(itx.guild.id, userId);
    const totalPages = Math.max(1, Math.ceil(totalCases / 10));
    const target = await itx.client.users.fetch(userId).catch(() => ({ id: userId }));
    const { createHistoryEmbed } = await import("./moderation/ui/embeds.js");
    const embed = createHistoryEmbed(cases, target, newPage, totalPages, type === "all" ? null : type, counts);
    const { createPaginationComponents } = await import("./moderation/ui/components.js");
    const components = createPaginationComponents(newPage, totalPages, `history:${userId}:${type}`);
    return itx.update({ embeds: [embed], components });
  },
  user: async (itx, customId) => {
    const [_, userId] = customId.split(":");
    const view = itx.values[0];
    return userinfo.handleSelectMenu(itx, userId, view);
  }
};


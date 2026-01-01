import { moderationSlashCommands } from "./moderation/slash.js";
import { blacklistSlashCommands } from "./blacklist/slash.js";
import { infoSlashCommands } from "./info/slash.js";
import { permissionsSlashCommands } from "./permissions/slash.js";
import { moderationHandlers } from "./moderation/router.js";
import { blacklistHandlers } from "./blacklist/router.js";
import { infoHandlers, infoComponentHandlers } from "./info/router.js";
import { permissionsHandlers, permissionsAutocompleteHandlers } from "./permissions/router.js";
import * as userinfo from "./info/commands/userinfo.js";

export const allSlashCommands = [
  ...moderationSlashCommands,
  ...blacklistSlashCommands,
  ...infoSlashCommands,
  ...permissionsSlashCommands
];

export const commandHandlers = {
  ...moderationHandlers,
  ...blacklistHandlers,
  ...infoHandlers,
  ...permissionsHandlers
};

export const autocompleteHandlers = {
  ...permissionsAutocompleteHandlers
};

export const componentHandlers = {
  ...infoComponentHandlers,
  history: async (itx, customId) => {
    const [_, userId, type, action, page] = customId.split(":");
    const newPage = action === "next" ? parseInt(page) + 1 : parseInt(page) - 1;
    const cases = await import("./moderation/services/cases.service.js").then(m => 
      m.getUserCases(itx.guild.id, userId, type === "all" ? null : type, 10, (newPage - 1) * 10)
    );
    const totalCases = await import("./moderation/services/cases.service.js").then(m => 
      m.countUserCases(itx.guild.id, userId)
    );
    const totalPages = Math.max(1, Math.ceil(totalCases / 10));
    const target = await itx.client.users.fetch(userId).catch(() => ({ id: userId }));
    const embed = await import("./moderation/ui/embeds.js").then(m => 
      m.createHistoryEmbed(cases, target, newPage, totalPages, type === "all" ? null : type)
    );
    const components = await import("./moderation/ui/components.js").then(m => 
      m.createPaginationComponents(newPage, totalPages, `history:${userId}:${type}`)
    );
    return itx.update({ embeds: [embed], components });
  },
  user: async (itx, customId) => {
    const [_, userId] = customId.split(":");
    const view = itx.values[0];
    return userinfo.handleSelectMenu(itx, userId, view);
  }
};


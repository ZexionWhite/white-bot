import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createBlacklistHistoryEmbed, createErrorEmbed } from "../ui/embeds.js";
import { createPaginationComponents } from "../../moderation/ui/components.js";
import { getLocaleForGuild, t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";
import { MessageFlags } from "discord.js";

const ENTRIES_PER_PAGE = 10;

export async function handle(itx) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  
  if (!itx.inGuild()) {
    return itx.reply({ content: `❌ ${t(locale, "common.errors.guild_only")}`, flags: MessageFlags.Ephemeral });
  }

  const target = itx.options.getUser("user", true);

  if (!await PermService.canExecuteCommand(itx.member, "blacklist.history")) {
    return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.permission_denied"), locale)], flags: MessageFlags.Ephemeral });
  }

  const allEntries = await BlacklistService.getUserEntries(itx.guild.id, target.id);
  const totalEntries = allEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const page = 1;

  const entries = allEntries.slice(0, ENTRIES_PER_PAGE);

  const counts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  allEntries.forEach(e => {
    const severity = (e.severity || "MEDIUM").toUpperCase();
    if (severity === "LOW") counts.low++;
    else if (severity === "MEDIUM") counts.medium++;
    else if (severity === "HIGH") counts.high++;
    else if (severity === "CRITICAL") counts.critical++;
  });

  const embed = createBlacklistHistoryEmbed(entries, target, page, totalPages, counts, locale);
  const components = totalPages > 1 ? createPaginationComponents(page, totalPages, `blacklisthistory:${target.id}:all`) : [];

  return itx.reply({ embeds: [embed], components });
}

/**
 * Comando /queue
 * Muestra la cola de reproducción
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { getQueue } from "../services/queue.service.js";
import { getCurrentTrack } from "../services/player.service.js";
import { createQueueEmbed } from "../ui/embeds.js";
import { createErrorEmbed } from "../ui/embeds.js";

const ITEMS_PER_PAGE = 10;

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const locale = await getLocaleForGuildId(itx.guild.id);
  const page = itx.options.getInteger("page") || 1;

  if (page < 1) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.page_invalid"))],
      ephemeral: true
    });
  }

  const guildId = itx.guild.id;
  const queue = getQueue(guildId);
  const currentTrack = getCurrentTrack(guildId);

  if (queue.isEmpty() && !currentTrack) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.queue_empty"))],
      ephemeral: true
    });
  }

  // Obtener items de la cola
  const allItems = queue.getAll();
  const totalPages = Math.max(1, Math.ceil(allItems.length / ITEMS_PER_PAGE));
  const actualPage = Math.min(page, totalPages);

  const startIndex = (actualPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = allItems.slice(startIndex, endIndex);

  // Crear embed
  const embed = createQueueEmbed(pageItems, currentTrack ? { track: currentTrack } : null, actualPage, totalPages, locale);

  return itx.reply({ embeds: [embed] });
}

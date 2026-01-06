/**
 * Comando /nowplaying
 * Muestra la canción que se está reproduciendo
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { getCurrentTrack, getPosition, isPlaying } from "../services/player.service.js";
import { getQueue } from "../services/queue.service.js";
import { createNowPlayingEmbed } from "../ui/embeds.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { getLoopMode, getAutoplay } from "../events/trackEnd.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const locale = await getLocaleForGuildId(itx.guild.id);
  const guildId = itx.guild.id;

  const currentTrack = getCurrentTrack(guildId);

  if (!currentTrack || !isPlaying(guildId)) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.not_playing"))],
      ephemeral: true
    });
  }

  const position = getPosition(guildId);
  const queue = getQueue(guildId);
  
  // Buscar requester del track actual (si está en la cola)
  let requesterId = null;
  const allItems = queue.getAll();
  const currentItem = allItems.find(item => item.track.info.identifier === currentTrack.info.identifier);
  if (!currentItem) {
    // Podría ser el track que se está reproduciendo ahora, buscar en historial o usar null
  } else {
    requesterId = currentItem.requesterId;
  }

  const loopMode = getLoopMode(guildId);
  const autoplay = getAutoplay(guildId);

  const embed = createNowPlayingEmbed(currentTrack, position, requesterId, locale, loopMode, autoplay);

  return itx.reply({ embeds: [embed] });
}

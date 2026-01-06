/**
 * Embeds para el módulo de música
 */
import { EmbedBuilder } from "discord.js";
import { formatDurationMs } from "../../../utils/duration.js";
import { t } from "../../../core/i18n/index.js";

/**
 * Crea un embed de error
 * @param {string} message - Mensaje de error
 * @returns {EmbedBuilder}
 */
export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(`❌ ${message}`);
}

/**
 * Formatea duración en formato mm:ss o hh:mm:ss
 */
function formatTrackDuration(ms) {
  if (!ms || ms < 0) return "0:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Formatea posición actual y duración total
 */
function formatPosition(current, total) {
  const currentFormatted = formatTrackDuration(current);
  const totalFormatted = formatTrackDuration(total);
  return `${currentFormatted} / ${totalFormatted}`;
}

/**
 * Crea el embed de "Now Playing"
 * @param {object} track - Track de Lavalink
 * @param {number} position - Posición actual en milisegundos
 * @param {string} requesterId - ID del usuario que lo solicitó (opcional)
 * @param {string} locale - Locale
 * @param {string} loopMode - Modo de loop (off, track, queue)
 * @param {boolean} autoplay - Si autoplay está activado
 * @returns {EmbedBuilder}
 */
export function createNowPlayingEmbed(track, position, requesterId, locale, loopMode = "off", autoplay = false) {
  const info = track.info;
  const title = info.title || "Unknown Title";
  const author = info.author || "Unknown Artist";
  const duration = info.length || 0;
  const thumbnail = info.thumbnail || info.artworkUrl || null;

  const embed = new EmbedBuilder()
    .setTitle(t(locale, "music.embeds.nowplaying.title"))
    .setColor(0x5865f2)
    .addFields(
      {
        name: t(locale, "music.embeds.nowplaying.author"),
        value: author,
        inline: true
      },
      {
        name: t(locale, "music.embeds.nowplaying.duration"),
        value: formatPosition(position, duration),
        inline: true
      }
    );

  if (requesterId) {
    embed.addFields({
      name: t(locale, "music.embeds.nowplaying.requester"),
      value: `<@${requesterId}>`,
      inline: true
    });
  }

  // Información adicional
  const statusFields = [];
  
  if (loopMode !== "off") {
    const loopText = loopMode === "track" 
      ? t(locale, "music.embeds.nowplaying.loop_track")
      : t(locale, "music.embeds.nowplaying.loop_queue");
    statusFields.push({
      name: t(locale, "music.embeds.nowplaying.loop_mode"),
      value: loopText,
      inline: true
    });
  }

  if (autoplay) {
    statusFields.push({
      name: t(locale, "music.embeds.nowplaying.autoplay"),
      value: t(locale, "music.embeds.nowplaying.autoplay_on"),
      inline: true
    });
  }

  if (statusFields.length > 0) {
    embed.addFields(statusFields);
  }

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  // URL si está disponible
  if (info.uri) {
    embed.setURL(info.uri);
    embed.setDescription(`[${title}](${info.uri})`);
  } else {
    embed.setDescription(title);
  }

  return embed;
}

/**
 * Crea el embed de la cola
 * @param {Array} queueItems - Items de la cola (con track y requesterId)
 * @param {object} currentTrack - Track actual (opcional)
 * @param {number} page - Página actual
 * @param {number} totalPages - Total de páginas
 * @param {string} locale - Locale
 * @returns {EmbedBuilder}
 */
export function createQueueEmbed(queueItems, currentTrack, page, totalPages, locale) {
  const embed = new EmbedBuilder()
    .setTitle(t(locale, "music.embeds.queue.title"))
    .setColor(0x5865f2);

  if (queueItems.length === 0 && !currentTrack) {
    embed.setDescription(t(locale, "music.embeds.queue.empty"));
    return embed;
  }

  const description = [];

  // Track actual
  if (currentTrack) {
    const info = currentTrack.track.info;
    const title = info.title || "Unknown Title";
    const author = info.author || "Unknown Artist";
    const duration = formatTrackDuration(info.length || 0);
    
    description.push(`**${t(locale, "music.embeds.queue.now_playing")}**`);
    description.push(`\`${duration}\` [${title}](${info.uri || "#"}) - ${author}`);
    description.push("");
  }

  // Próximos tracks
  if (queueItems.length > 0) {
    description.push(`**${t(locale, "music.embeds.queue.up_next")}**`);
    
    queueItems.forEach((item, index) => {
      const info = item.track.info;
      const title = info.title || "Unknown Title";
      const author = info.author || "Unknown Artist";
      const duration = formatTrackDuration(info.length || 0);
      const requester = item.requesterId ? ` <@${item.requesterId}>` : "";
      
      description.push(`${index + 1}. \`${duration}\` [${title}](${info.uri || "#"}) - ${author}${requester}`);
    });
  } else {
    description.push(t(locale, "music.embeds.queue.empty"));
  }

  embed.setDescription(description.join("\n"));

  // Footer con paginación
  if (totalPages > 1) {
    embed.setFooter({
      text: t(locale, "music.embeds.queue.page", { current: page, total: totalPages })
    });
  }

  return embed;
}

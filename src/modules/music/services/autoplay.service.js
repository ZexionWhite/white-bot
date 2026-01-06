/**
 * Servicio de autoplay
 * Maneja la reproducción automática de canciones similares cuando la cola se vacía
 */
import { getLavalinkClient } from "./lavalink.service.js";
import { getQueue } from "./queue.service.js";
import { getPlayer, playTrack } from "./player.service.js";
import { log } from "../../../core/logger/index.js";

// Historial de tracks reproducidos por guild (últimos 50)
const trackHistory = new Map();

// Set de identificadores ya reproducidos para evitar duplicados
const playedIdentifiers = new Map();

/**
 * Añade un track al historial
 * @param {string} guildId - ID del guild
 * @param {object} track - Track de Lavalink
 */
export function addToHistory(guildId, track) {
  if (!trackHistory.has(guildId)) {
    trackHistory.set(guildId, []);
    playedIdentifiers.set(guildId, new Set());
  }

  const history = trackHistory.get(guildId);
  const identifiers = playedIdentifiers.get(guildId);

  // Añadir al inicio
  history.unshift({
    track,
    timestamp: Date.now()
  });

  // Mantener solo los últimos 50
  if (history.length > 50) {
    const removed = history.pop();
    if (removed && removed.track && removed.track.info) {
      identifiers.delete(removed.track.info.identifier);
    }
  }

  // Añadir identificador
  if (track && track.info && track.info.identifier) {
    identifiers.add(track.info.identifier);
  }
}

/**
 * Obtiene el último track reproducido (seed para autoplay)
 * @param {string} guildId - ID del guild
 * @returns {object|null}
 */
export function getLastTrack(guildId) {
  const history = trackHistory.get(guildId);
  if (!history || history.length === 0) return null;
  return history[0].track;
}

/**
 * Verifica si un track ya fue reproducido (para evitar duplicados)
 * @param {string} guildId - ID del guild
 * @param {string} identifier - Identificador del track
 * @returns {boolean}
 */
export function wasPlayed(guildId, identifier) {
  const identifiers = playedIdentifiers.get(guildId);
  if (!identifiers) return false;
  return identifiers.has(identifier);
}

/**
 * Añade un identificador a la lista de reproducidos
 * @param {string} guildId - ID del guild
 * @param {string} identifier - Identificador del track
 */
export function markAsPlayed(guildId, identifier) {
  if (!playedIdentifiers.has(guildId)) {
    playedIdentifiers.set(guildId, new Set());
  }
  playedIdentifiers.get(guildId).add(identifier);
}

/**
 * Busca y añade canciones similares a la cola
 * @param {string} guildId - ID del guild
 * @returns {Promise<number>} Número de tracks añadidos
 */
export async function addSimilarTracks(guildId) {
  const lastTrack = getLastTrack(guildId);
  if (!lastTrack || !lastTrack.info) {
    log.debug("Autoplay", `No hay track previo para autoplay en guild ${guildId}`);
    return 0;
  }

  const client = getLavalinkClient();
  if (!client) {
    log.error("Autoplay", "Cliente de Lavalink no inicializado");
    return 0;
  }

  const queue = getQueue(guildId);
  const title = lastTrack.info.title || "";
  const author = lastTrack.info.author || "";

  // Construir query de búsqueda
  let searchQuery = "";
  if (author && title) {
    // Intentar con título y autor
    searchQuery = `${author} - ${title}`;
  } else if (author) {
    // Solo autor
    searchQuery = author;
  } else if (title) {
    // Solo título
    searchQuery = title;
  } else {
    log.debug("Autoplay", "No hay metadata suficiente para buscar similares");
    return 0;
  }

  log.debug("Autoplay", `Buscando similares para: ${searchQuery}`);

  try {
    // Buscar con ytmsearch
    const result = await client.search({ query: searchQuery, source: "ytmsearch" }, null);
    
    if (!result || !result.tracks || result.tracks.length === 0) {
      log.debug("Autoplay", "No se encontraron tracks similares");
      return 0;
    }

    // Filtrar duplicados y añadir 1-3 tracks
    let added = 0;
    const maxTracks = 3;

    for (const track of result.tracks) {
      if (added >= maxTracks) break;

      const identifier = track.info.identifier;
      
      // Evitar duplicados
      if (wasPlayed(guildId, identifier)) {
        continue;
      }

      // Evitar el mismo track
      if (identifier === lastTrack.info.identifier) {
        continue;
      }

      // Añadir a la cola
      queue.enqueue(track, null); // Sin requester para autoplay
      markAsPlayed(guildId, identifier);
      added++;
    }

    log.info("Autoplay", `Añadidos ${added} tracks similares en guild ${guildId}`);
    return added;

  } catch (error) {
    log.error("Autoplay", `Error buscando tracks similares:`, error);
    return 0;
  }
}

/**
 * Limpia el historial de un guild
 * @param {string} guildId - ID del guild
 */
export function clearHistory(guildId) {
  trackHistory.delete(guildId);
  playedIdentifiers.delete(guildId);
}

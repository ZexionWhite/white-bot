import { getLavalinkClient } from "./lavalink.service.js";
import { getQueue } from "./queue.service.js";
import { getPlayer, playTrack } from "./player.service.js";
import { log } from "../../../core/logger/index.js";

const trackHistory = new Map();

const playedIdentifiers = new Map();

export function addToHistory(guildId, track) {
  if (!trackHistory.has(guildId)) {
    trackHistory.set(guildId, []);
    playedIdentifiers.set(guildId, new Set());
  }

  const history = trackHistory.get(guildId);
  const identifiers = playedIdentifiers.get(guildId);

  history.unshift({
    track,
    timestamp: Date.now()
  });

  if (history.length > 50) {
    const removed = history.pop();
    if (removed && removed.track && removed.track.info) {
      identifiers.delete(removed.track.info.identifier);
    }
  }

  if (track && track.info && track.info.identifier) {
    identifiers.add(track.info.identifier);
  }
}

export function getLastTrack(guildId) {
  const history = trackHistory.get(guildId);
  if (!history || history.length === 0) return null;
  return history[0].track;
}

export function wasPlayed(guildId, identifier) {
  const identifiers = playedIdentifiers.get(guildId);
  if (!identifiers) return false;
  return identifiers.has(identifier);
}

export function markAsPlayed(guildId, identifier) {
  if (!playedIdentifiers.has(guildId)) {
    playedIdentifiers.set(guildId, new Set());
  }
  playedIdentifiers.get(guildId).add(identifier);
}

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

  let searchQuery = "";
  if (author && title) {
    searchQuery = `${author} - ${title}`;
  } else if (author) {
    searchQuery = author;
  } else if (title) {
    searchQuery = title;
  } else {
    log.debug("Autoplay", "No hay metadata suficiente para buscar similares");
    return 0;
  }

  log.debug("Autoplay", `Buscando similares para: ${searchQuery}`);

  const nodeManager = client.nodeManager;
  if (!nodeManager || !nodeManager.nodes) {
    log.error("Autoplay", "NodeManager no disponible");
    return 0;
  }

  let node = null;
  for (const n of nodeManager.nodes.values()) {
    if (n && n.isAlive === true) {
      node = n;
      break;
    }
  }

  if (!node || !node.rest) {
    log.error("Autoplay", "No hay nodos disponibles");
    return 0;
  }

  try {
    const result = await node.rest.loadTracks(`ytmsearch:${searchQuery}`);
    
    if (!result || !result.tracks || result.tracks.length === 0) {
      log.debug("Autoplay", "No se encontraron tracks similares");
      return 0;
    }

    let added = 0;
    const maxTracks = 3;

    for (const track of result.tracks) {
      if (added >= maxTracks) break;

      const identifier = track.info.identifier;
      
      if (wasPlayed(guildId, identifier)) {
        continue;
      }

      if (identifier === lastTrack.info.identifier) {
        continue;
      }

      queue.enqueue(track, null);
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

export function clearHistory(guildId) {
  trackHistory.delete(guildId);
  playedIdentifiers.delete(guildId);
}

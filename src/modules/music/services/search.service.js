import { getLavalinkClient } from "./lavalink.service.js";
import { log } from "../../../core/logger/index.js";

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
const SPOTIFY_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist|artist)\/.+/;

function getAvailableNode() {
  const manager = getLavalinkClient();
  if (!manager) {
    return null;
  }

  if (!manager.nodeManager || !manager.nodeManager.nodes) {
    return null;
  }

  let bestNode = null;
  let nodeCount = 0;
  
  for (const node of manager.nodeManager.nodes.values()) {
    nodeCount++;
    if (!node) continue;
    
    if (node.isAlive === true) {
      return node;
    }
    
    if (!bestNode && node.rest) {
      bestNode = node;
    }
  }

  if (nodeCount === 0) {
    return null;
  }

  return bestNode;
}

export async function resolveQuery(query, requester = null) {
  const manager = getLavalinkClient();
  if (!manager) {
    const { isLavalinkReady } = await import("./lavalink.service.js");
    if (!isLavalinkReady()) {
      throw new Error("Lavalink no está disponible");
    }
    throw new Error("Cliente de Lavalink no inicializado");
  }

  const node = getAvailableNode();
  if (!node || !node.rest) {
    throw new Error("No hay nodos de Lavalink disponibles");
  }

  try {
    if (YOUTUBE_REGEX.test(query)) {
      log.debug("Search", `Resolviendo URL de YouTube: ${query}`);
      const result = await node.rest.loadTracks(query);
      return result;
    }

    if (SPOTIFY_REGEX.test(query)) {
      log.debug("Search", `Resolviendo URL de Spotify: ${query}`);
      
      try {
        const spotifyResult = await node.rest.loadTracks(`spsearch:${query}`);
        if (spotifyResult && spotifyResult.tracks && spotifyResult.tracks.length > 0) {
          return spotifyResult;
        }
      } catch (error) {
        log.debug("Search", "LavaSrc no pudo resolver Spotify, intentando mirroring...");
      }

      return await resolveSpotifyMirroring(query, requester);
    }

    log.debug("Search", `Buscando: ${query}`);
    
    try {
      const ytmResult = await node.rest.loadTracks(`ytmsearch:${query}`);
      if (ytmResult && ytmResult.tracks && ytmResult.tracks.length > 0) {
        return ytmResult;
      }
    } catch (error) {
      log.debug("Search", "ytmsearch falló, intentando ytsearch...");
    }

    const ytResult = await node.rest.loadTracks(`ytsearch:${query}`);
    return ytResult;

  } catch (error) {
    log.error("Search", `Error resolviendo query "${query}":`, error);
    throw error;
  }
}

async function resolveSpotifyMirroring(spotifyUrl, requester = null) {
  const node = getAvailableNode();
  if (!node || !node.rest) {
    throw new Error("No hay nodos de Lavalink disponibles");
  }

  const match = spotifyUrl.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error("URL de Spotify inválida");
  }

  const [, type, id] = match;

  log.debug("Search", `Mirroring Spotify ${type} ${id} a YouTube`);
  
  try {
    const result = await node.rest.loadTracks(`spsearch:${spotifyUrl}`);
    if (result && result.tracks && result.tracks.length > 0) {
      return result;
    }
  } catch (error) {
    throw new Error("No se pudo resolver la URL de Spotify. Intenta buscar el nombre de la canción directamente.");
  }

  const ytResult = await node.rest.loadTracks(`ytsearch:${id}`);
  return ytResult;
}

export function getFirstTrack(result) {
  if (!result || !result.tracks || result.tracks.length === 0) {
    return null;
  }
  return result.tracks[0];
}

export function isPlaylist(result) {
  return result && result.loadType === "PLAYLIST_LOADED";
}

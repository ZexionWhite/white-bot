/**
 * Servicio de búsqueda de tracks
 * Maneja la resolución de queries y URLs (YouTube, Spotify, etc.)
 */
import { getLavalinkClient } from "./lavalink.service.js";
import { log } from "../../../core/logger/index.js";

// Regex para detectar URLs
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
const SPOTIFY_REGEX = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist|artist)\/.+/;

/**
 * Obtiene un nodo disponible de Lavalink
 * @returns {object|null} Nodo de Lavalink
 */
function getAvailableNode() {
  const manager = getLavalinkClient();
  if (!manager || !manager.nodeManager || !manager.nodeManager.nodes) {
    return null;
  }

  // Buscar el primer nodo disponible (preferir nodos vivos)
  let bestNode = null;
  for (const node of manager.nodeManager.nodes.values()) {
    if (!node) continue;
    
    // Preferir nodos que están vivos
    if (node.isAlive === true) {
      return node;
    }
    
    // Si no hay nodos vivos, al menos usar el primer nodo disponible (puede estar conectando)
    if (!bestNode && node.rest) {
      bestNode = node;
    }
  }

  // Retornar el mejor nodo encontrado (aunque no esté completamente conectado)
  return bestNode;
}

/**
 * Resuelve una query o URL a tracks
 * @param {string} query - Query de búsqueda o URL
 * @returns {Promise<{loadType: string, tracks: Array, playlistInfo?: object}>}
 */
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
    // Si es URL de YouTube, cargar directo
    if (YOUTUBE_REGEX.test(query)) {
      log.debug("Search", `Resolviendo URL de YouTube: ${query}`);
      const result = await node.rest.loadTracks(query);
      return result;
    }

    // Si es URL de Spotify, intentar resolver con LavaSrc primero
    if (SPOTIFY_REGEX.test(query)) {
      log.debug("Search", `Resolviendo URL de Spotify: ${query}`);
      
      // Intentar con LavaSrc (spsearch)
      try {
        const spotifyResult = await node.rest.loadTracks(`spsearch:${query}`);
        if (spotifyResult && spotifyResult.tracks && spotifyResult.tracks.length > 0) {
          return spotifyResult;
        }
      } catch (error) {
        log.debug("Search", "LavaSrc no pudo resolver Spotify, intentando mirroring...");
      }

      // Fallback: parsear metadata y buscar en YouTube
      return await resolveSpotifyMirroring(query, requester);
    }

    // Si es texto, buscar primero con ytmsearch, luego ytsearch
    log.debug("Search", `Buscando: ${query}`);
    
    // Intentar ytmsearch primero (mejor calidad)
    try {
      const ytmResult = await node.rest.loadTracks(`ytmsearch:${query}`);
      if (ytmResult && ytmResult.tracks && ytmResult.tracks.length > 0) {
        return ytmResult;
      }
    } catch (error) {
      log.debug("Search", "ytmsearch falló, intentando ytsearch...");
    }

    // Fallback a ytsearch
    const ytResult = await node.rest.loadTracks(`ytsearch:${query}`);
    return ytResult;

  } catch (error) {
    log.error("Search", `Error resolviendo query "${query}":`, error);
    throw error;
  }
}

/**
 * Resuelve una URL de Spotify mediante mirroring (parsear y buscar en YouTube)
 * @param {string} spotifyUrl - URL de Spotify
 * @returns {Promise<{loadType: string, tracks: Array}>}
 */
async function resolveSpotifyMirroring(spotifyUrl, requester = null) {
  const node = getAvailableNode();
  if (!node || !node.rest) {
    throw new Error("No hay nodos de Lavalink disponibles");
  }

  // Extraer tipo y ID de la URL de Spotify
  const match = spotifyUrl.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error("URL de Spotify inválida");
  }

  const [, type, id] = match;

  // Para tracks individuales, intentar obtener metadata
  // Nota: Esto requeriría una API de Spotify, pero por ahora hacemos búsqueda directa
  // En producción podrías usar la API de Spotify para obtener título/artista
  
  // Por ahora, intentar buscar con el ID o la URL completa
  // Esto es un fallback básico - en producción deberías usar la API de Spotify
  log.debug("Search", `Mirroring Spotify ${type} ${id} a YouTube`);
  
  // Intentar búsqueda genérica (el usuario debería proporcionar el nombre si es posible)
  // Por ahora, intentamos con spsearch de LavaSrc que debería manejar esto
  try {
    const result = await node.rest.loadTracks(`spsearch:${spotifyUrl}`);
    if (result && result.tracks && result.tracks.length > 0) {
      return result;
    }
  } catch (error) {
    // Si falla, lanzar error para que el usuario sepa que necesita proporcionar más info
    throw new Error("No se pudo resolver la URL de Spotify. Intenta buscar el nombre de la canción directamente.");
  }

  // Último recurso: buscar en YouTube con el ID (probablemente no funcione bien)
  const ytResult = await node.rest.loadTracks(`ytsearch:${id}`);
  return ytResult;
}

/**
 * Obtiene el primer track de un resultado
 * @param {object} result - Resultado de loadTracks
 * @returns {object|null}
 */
export function getFirstTrack(result) {
  if (!result || !result.tracks || result.tracks.length === 0) {
    return null;
  }
  return result.tracks[0];
}

/**
 * Verifica si el resultado es una playlist
 * @param {object} result - Resultado de loadTracks
 * @returns {boolean}
 */
export function isPlaylist(result) {
  return result && result.loadType === "PLAYLIST_LOADED";
}

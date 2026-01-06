/**
 * Evento de fin de track
 * Maneja loop, siguiente track, autoplay y desconexión por inactividad
 */
import { getQueue } from "../services/queue.service.js";
import { getPlayer, playTrack, isPlaying, scheduleIdleTimeout, disconnect, cleanup } from "../services/player.service.js";
import { addToHistory } from "../services/autoplay.service.js";
import { addSimilarTracks } from "../services/autoplay.service.js";
import { log } from "../../../core/logger/index.js";

// Almacenamiento: guildId -> { loopMode: "off"|"track"|"queue", autoplay: boolean }
const guildSettings = new Map();

/**
 * Configura el modo de loop para un guild
 * @param {string} guildId - ID del guild
 * @param {string} mode - Modo (off, track, queue)
 */
export function setLoopMode(guildId, mode) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, { loopMode: "off", autoplay: false });
  }
  guildSettings.get(guildId).loopMode = mode;
}

/**
 * Obtiene el modo de loop de un guild
 * @param {string} guildId - ID del guild
 * @returns {string}
 */
export function getLoopMode(guildId) {
  const settings = guildSettings.get(guildId);
  return settings ? settings.loopMode : "off";
}

/**
 * Configura el autoplay para un guild
 * @param {string} guildId - ID del guild
 * @param {boolean} enabled - Si está habilitado
 */
export function setAutoplay(guildId, enabled) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, { loopMode: "off", autoplay: false });
  }
  guildSettings.get(guildId).autoplay = enabled;
}

/**
 * Obtiene el estado de autoplay de un guild
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function getAutoplay(guildId) {
  const settings = guildSettings.get(guildId);
  return settings ? settings.autoplay : false;
}

/**
 * Maneja el evento de fin de track
 * @param {string} guildId - ID del guild
 * @param {object} track - Track que terminó
 * @param {string} reason - Razón (FINISHED, LOAD_FAILED, STOPPED, REPLACED, CLEANUP)
 */
export async function handleTrackEnd(guildId, track, reason) {
  log.debug("TrackEnd", `Track terminado en guild ${guildId}, razón: ${reason}`);

  // Si fue detenido manualmente o reemplazado, no hacer nada
  if (reason === "STOPPED" || reason === "REPLACED" || reason === "CLEANUP") {
    return;
  }

  // Si falló la carga, intentar siguiente track
  if (reason === "LOAD_FAILED") {
    await playNext(guildId);
    return;
  }

  // Añadir al historial
  if (track) {
    addToHistory(guildId, track);
  }

  const loopMode = getLoopMode(guildId);
  const queue = getQueue(guildId);

  // Manejar loop de track
  if (loopMode === "track" && track) {
    log.debug("TrackEnd", `Reproduciendo track en loop en guild ${guildId}`);
    await playTrack(guildId, track);
    return;
  }

  // Obtener siguiente track de la cola
  const nextItem = queue.dequeue();

  if (nextItem) {
    // Hay siguiente track, reproducirlo
    log.debug("TrackEnd", `Reproduciendo siguiente track en guild ${guildId}`);
    await playTrack(guildId, nextItem.track);
    return;
  }

  // Cola vacía
  log.debug("TrackEnd", `Cola vacía en guild ${guildId}`);

  // Manejar loop de cola (si había tracks antes)
  if (loopMode === "queue" && track) {
    // En un loop de cola real, necesitarías mantener los tracks
    // Por ahora, si la cola está vacía, no hay nada que loopear
    log.debug("TrackEnd", "Loop de cola pero cola vacía");
  }

  // Verificar autoplay
  const autoplay = getAutoplay(guildId);
  if (autoplay) {
    log.debug("TrackEnd", `Autoplay activado, buscando similares en guild ${guildId}`);
    
    const added = await addSimilarTracks(guildId);
    if (added > 0) {
      // Reproducir el primer track añadido
      const nextItem = queue.dequeue();
      if (nextItem) {
        await playTrack(guildId, nextItem.track);
        return;
      }
    }
  }

  // No hay más tracks y no hay autoplay o no se encontraron similares
  // Programar desconexión por inactividad
  scheduleIdleTimeout(guildId);
}

/**
 * Reproduce el siguiente track de la cola
 * @param {string} guildId - ID del guild
 */
async function playNext(guildId) {
  const queue = getQueue(guildId);
  const nextItem = queue.dequeue();

  if (nextItem) {
    await playTrack(guildId, nextItem.track);
  } else {
    // Cola vacía, programar timeout
    scheduleIdleTimeout(guildId);
  }
}

/**
 * Limpia la configuración de un guild
 * @param {string} guildId - ID del guild
 */
export function clearSettings(guildId) {
  guildSettings.delete(guildId);
}

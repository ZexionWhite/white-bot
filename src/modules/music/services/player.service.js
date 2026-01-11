/**
 * Servicio de gesti?n de players de Lavalink
 * Maneja la creaci?n y gesti?n de players por guild
 */
import { getLavalinkClient } from "./lavalink.service.js";
import { getQueue, deleteQueue } from "./queue.service.js";
import { log } from "../../../core/logger/index.js";

// Almacenamiento: guildId -> Player
const players = new Map();

// Timeout de desconexi?n por inactividad (5 minutos)
const IDLE_TIMEOUT = 5 * 60 * 1000;
const idleTimeouts = new Map();

/**
 * Obtiene o crea un player para un guild
 * @param {string} guildId - ID del guild
 * @returns {import("lavalink-client").Player|null}
 */
export function getPlayer(guildId) {
  const client = getLavalinkClient();
  if (!client) {
    log.error("Player", "Cliente de Lavalink no inicializado");
    return null;
  }

  if (!players.has(guildId)) {
    const player = client.createPlayer({
      guildId: guildId,
      voiceChannelId: null,
      textChannelId: null,
      selfDeaf: true,
      selfMute: false
    });

    // Eventos del player
    player.on("trackStart", () => {
      log.debug("Player", `Track iniciado en guild ${guildId}`);
      clearIdleTimeout(guildId);
    });

    player.on("trackEnd", async (data) => {
      try {
        log.debug("Player", `Track terminado en guild ${guildId}`, data);
        // Llamar al handler de trackEnd
        const { handleTrackEnd } = await import("../events/trackEnd.js");
        // El evento trackEnd de lavalink-client puede tener diferentes estructuras
        // Intentar obtener el track y la raz?n
        const track = data?.track || player.track || null;
        const reason = data?.reason || "FINISHED";
        if (track) {
          await handleTrackEnd(guildId, track, reason).catch((error) => {
            log.error("Player", `Error en handleTrackEnd para guild ${guildId}:`, error);
            // NO hacer throw - solo loggear
          });
        } else {
          // Si no hay track en el evento, intentar obtenerlo del player
          const currentTrack = player.track;
          if (currentTrack) {
            await handleTrackEnd(guildId, currentTrack, reason).catch((error) => {
              log.error("Player", `Error en handleTrackEnd para guild ${guildId}:`, error);
              // NO hacer throw
            });
          }
        }
      } catch (error) {
        log.error("Player", `Error en evento trackEnd para guild ${guildId}:`, error);
        // NO hacer throw - evitar crash
      }
    });

    player.on("trackStuck", () => {
      log.warn("Player", `Track atascado en guild ${guildId}`);
    });

    player.on("trackException", (data) => {
      log.error("Player", `Excepci?n en track guild ${guildId}:`, data);
      // NO hacer throw - solo loggear
    });

    player.on("connectionUpdate", (state) => {
      try {
        if (state === "DISCONNECTED") {
          log.info("Player", `Desconectado de guild ${guildId}`);
          cleanup(guildId);
        }
      } catch (error) {
        log.error("Player", `Error en connectionUpdate para guild ${guildId}:`, error);
        // NO hacer throw
      }
    });

    // Prevenir errores no capturados del player
    if (typeof player.on === "function") {
      // Agregar listener gen?rico de error si existe
      try {
        player.on("error", (error) => {
          log.error("Player", `Error en player guild ${guildId}:`, error);
          // NO hacer throw
        });
      } catch (err) {
        // El player puede no tener evento error, ignorar
      }
    }

    players.set(guildId, player);
  }

  return players.get(guildId);
}

/**
 * Conecta el player a un canal de voz
 * @param {string} guildId - ID del guild
 * @param {string} voiceChannelId - ID del canal de voz
 * @param {string} textChannelId - ID del canal de texto (opcional)
 * @returns {Promise<boolean>}
 */
export async function connectToVoice(guildId, voiceChannelId, textChannelId = null) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    await player.connect({
      voiceChannelId,
      textChannelId,
      selfDeaf: true,
      selfMute: false
    });

    player.setVoiceChannelId(voiceChannelId);
    if (textChannelId) {
      player.setTextChannelId(textChannelId);
    }

    clearIdleTimeout(guildId);
    return true;
  } catch (error) {
    log.error("Player", `Error conectando a voz en guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Reproduce un track
 * @param {string} guildId - ID del guild
 * @param {object} track - Track de Lavalink
 * @returns {Promise<boolean>}
 */
export async function playTrack(guildId, track) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    // La estructura del track de lavalink-client puede variar
    // Si tiene encoded directamente
    if (track.encoded) {
      await player.play({ track: { encoded: track.encoded } });
    }
    // Si tiene track.encoded (estructura anidada)
    else if (track.track && track.track.encoded) {
      await player.play({ track: { encoded: track.track.encoded } });
    }
    // Si tiene identifier
    else if (track.info && track.info.identifier) {
      await player.play({ track: { identifier: track.info.identifier } });
    }
    // Intentar con el track completo como clientTrack (formato de lavalink-client)
    else {
      await player.play({ clientTrack: track });
    }
    return true;
  } catch (error) {
    log.error("Player", `Error reproduciendo track en guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Pausa la reproducci?n
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function pause(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    player.pause(true);
    return true;
  } catch (error) {
    log.error("Player", `Error pausando en guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Reanuda la reproducci?n
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function resume(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    player.pause(false);
    return true;
  } catch (error) {
    log.error("Player", `Error reanudando en guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Detiene la reproducci?n
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function stop(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    player.stop();
    return true;
  } catch (error) {
    log.error("Player", `Error deteniendo en guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Verifica si est? reproduciendo
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function isPlaying(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;
  return player.playing === true;
}

/**
 * Verifica si est? pausado
 * @param {string} guildId - ID del guild
 * @returns {boolean}
 */
export function isPaused(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;
  return player.paused === true;
}

/**
 * Obtiene el track actual
 * @param {string} guildId - ID del guild
 * @returns {object|null}
 */
export function getCurrentTrack(guildId) {
  const player = getPlayer(guildId);
  if (!player || !player.track) return null;
  return player.track;
}

/**
 * Obtiene la posici?n actual del track
 * @param {string} guildId - ID del guild
 * @returns {number}
 */
export function getPosition(guildId) {
  const player = getPlayer(guildId);
  if (!player) return 0;
  return player.position || 0;
}

/**
 * Programa un timeout de inactividad
 * @param {string} guildId - ID del guild
 */
export function scheduleIdleTimeout(guildId) {
  clearIdleTimeout(guildId);

  const timeout = setTimeout(() => {
    log.info("Player", `Timeout de inactividad en guild ${guildId}, desconectando...`);
    disconnect(guildId);
    cleanup(guildId);
  }, IDLE_TIMEOUT);

  idleTimeouts.set(guildId, timeout);
}

/**
 * Limpia el timeout de inactividad
 * @param {string} guildId - ID del guild
 */
export function clearIdleTimeout(guildId) {
  if (idleTimeouts.has(guildId)) {
    clearTimeout(idleTimeouts.get(guildId));
    idleTimeouts.delete(guildId);
  }
}

/**
 * Desconecta el player
 * @param {string} guildId - ID del guild
 */
export async function disconnect(guildId) {
  const player = getPlayer(guildId);
  if (!player) return;

  try {
    log.debug("Player", `Desconectando player para guild ${guildId}`);
    await player.disconnect();
    log.debug("Player", `Player desconectado exitosamente para guild ${guildId}`);
  } catch (error) {
    log.error("Player", `Error desconectando en guild ${guildId}:`, error);
  }
}

/**
 * Limpia recursos del player
 * @param {string} guildId - ID del guild
 */
export function cleanup(guildId) {
  clearIdleTimeout(guildId);
  
  const player = players.get(guildId);
  if (player) {
    try {
      log.debug("Player", `Limpiando player para guild ${guildId} (destroy)`);
      player.destroy();
      log.debug("Player", `Player destruido exitosamente para guild ${guildId}`);
    } catch (error) {
      log.error("Player", `Error destruyendo player en guild ${guildId}:`, error);
    }
    players.delete(guildId);
  }

  deleteQueue(guildId);
}

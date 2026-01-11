import { getLavalinkClient } from "./lavalink.service.js";
import { getQueue, deleteQueue } from "./queue.service.js";
import { log } from "../../../core/logger/index.js";

const players = new Map();

const IDLE_TIMEOUT = 5 * 60 * 1000;
const idleTimeouts = new Map();

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

    player.on("trackStart", () => {
      log.debug("Player", `Track iniciado en guild ${guildId}`);
      clearIdleTimeout(guildId);
    });

    player.on("trackEnd", async (data) => {
      try {
        log.debug("Player", `Track terminado en guild ${guildId}`, data);
        const { handleTrackEnd } = await import("../events/trackEnd.js");
        const track = data?.track || player.track || null;
        const reason = data?.reason || "FINISHED";
        if (track) {
          await handleTrackEnd(guildId, track, reason).catch((error) => {
            log.error("Player", `Error en handleTrackEnd para guild ${guildId}:`, error);
          });
        } else {
          const currentTrack = player.track;
          if (currentTrack) {
            await handleTrackEnd(guildId, currentTrack, reason).catch((error) => {
              log.error("Player", `Error en handleTrackEnd para guild ${guildId}:`, error);
            });
          }
        }
      } catch (error) {
        log.error("Player", `Error en evento trackEnd para guild ${guildId}:`, error);
      }
    });

    player.on("trackStuck", () => {
      log.warn("Player", `Track atascado en guild ${guildId}`);
    });

    player.on("trackException", (data) => {
      log.error("Player", `Excepción en track guild ${guildId}:`, data);
    });

    player.on("connectionUpdate", (state) => {
      try {
        if (state === "DISCONNECTED") {
          log.info("Player", `Desconectado de guild ${guildId}`);
          cleanup(guildId);
        }
      } catch (error) {
        log.error("Player", `Error en connectionUpdate para guild ${guildId}:`, error);
      }
    });

    if (typeof player.on === "function") {
      try {
        player.on("error", (error) => {
          log.error("Player", `Error en player guild ${guildId}:`, error);
        });
      } catch (err) {
      }
    }

    players.set(guildId, player);
  }

  return players.get(guildId);
}

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

export async function playTrack(guildId, track) {
  const player = getPlayer(guildId);
  if (!player) return false;

  try {
    if (track.encoded) {
      await player.play({ track: { encoded: track.encoded } });
    }
    else if (track.track && track.track.encoded) {
      await player.play({ track: { encoded: track.track.encoded } });
    }
    else if (track.info && track.info.identifier) {
      await player.play({ track: { identifier: track.info.identifier } });
    }
    else {
      await player.play({ clientTrack: track });
    }
    return true;
  } catch (error) {
    log.error("Player", `Error reproduciendo track en guild ${guildId}:`, error);
    return false;
  }
}

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

export function isPlaying(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;
  return player.playing === true;
}

export function isPaused(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;
  return player.paused === true;
}

export function getCurrentTrack(guildId) {
  const player = getPlayer(guildId);
  if (!player || !player.track) return null;
  return player.track;
}

export function getPosition(guildId) {
  const player = getPlayer(guildId);
  if (!player) return 0;
  return player.position || 0;
}

export function scheduleIdleTimeout(guildId) {
  clearIdleTimeout(guildId);

  const timeout = setTimeout(() => {
    log.info("Player", `Timeout de inactividad en guild ${guildId}, desconectando...`);
    disconnect(guildId);
    cleanup(guildId);
  }, IDLE_TIMEOUT);

  idleTimeouts.set(guildId, timeout);
}

export function clearIdleTimeout(guildId) {
  if (idleTimeouts.has(guildId)) {
    clearTimeout(idleTimeouts.get(guildId));
    idleTimeouts.delete(guildId);
  }
}

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

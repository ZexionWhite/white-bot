import { getSettings, incrementVoiceTime } from "../db.js";
import { startVoiceSession as startVoiceSessionDB, endVoiceSession as endVoiceSessionDB, getVoiceSession as getVoiceSessionDB } from "../db.js";
import { getVoiceSession, setVoiceSession, deleteVoiceSession } from "../core/redis/index.js";
import { voiceStateEmbed } from "../modules/settings/ui/voice.js";
import * as VoiceRepo from "../modules/moderation/db/voice.repo.js";
import { log } from "../core/logger/index.js";

export default async function voiceStateUpdate(client, oldState, newState) {
  try {
    const member = newState.member ?? oldState.member;
    if (!member) return;

    if (member.user?.bot) return;

    const oldChannelId = oldState.channel?.id ?? null;
    const newChannelId = newState.channel?.id ?? null;

    const guild = newState.guild ?? oldState.guild;
    if (!guild) return;

    const userId = member.id;
    const guildId = guild.id;
    const now = Date.now();

    let sessionForEmbed = null;
    
    if (oldChannelId) {
      // Intentar obtener sesión de Redis primero, fallback a PostgreSQL
      let session = await getVoiceSession(guildId, userId);
      if (!session) {
        // Fallback a PostgreSQL
        const dbSession = await getVoiceSessionDB.get(guildId, userId);
        if (dbSession) {
          session = { channel_id: dbSession.channel_id, join_timestamp: dbSession.join_timestamp };
        }
      }
      
      if (session) {
        sessionForEmbed = session;
        const joinTime = session.join_timestamp;
        const durationSeconds = Math.floor((now - joinTime) / 1000);
        
        if (durationSeconds > 0) {
          try {
            await incrementVoiceTime.run(guildId, userId, durationSeconds);
          } catch (err) {
            log.error("voiceStateUpdate", `Error al incrementar tiempo de voz para ${member.user.tag} en ${guild.name}:`, err.message);
          }
        }
        
        // Eliminar sesión de Redis y PostgreSQL
        await deleteVoiceSession(guildId, userId);
        try {
          await endVoiceSessionDB.run(guildId, userId);
        } catch (err) {
          log.error("voiceStateUpdate", `Error al eliminar sesión de voz de PostgreSQL:`, err.message);
        }
      }
    }

    if (newChannelId && !oldChannelId) {
      // Guardar sesión en Redis y PostgreSQL
      await setVoiceSession(guildId, userId, newChannelId, now);
      try {
        await startVoiceSessionDB.run(guildId, userId, newChannelId, now);
        await VoiceRepo.insertVoiceActivity.run(guildId, userId, "JOIN", newChannelId, now);
        await VoiceRepo.cleanupOldVoiceActivity.run(guildId, userId, guildId, userId);
      } catch (err) {
        log.error("voiceStateUpdate", `Error al iniciar sesión de voz en PostgreSQL para ${member.user.tag} en ${guild.name}:`, err.message);
      }
    } else if (newChannelId && oldChannelId && oldChannelId !== newChannelId) {
      // Movimiento entre canales: eliminar sesión anterior y crear nueva
      await deleteVoiceSession(guildId, userId);
      await setVoiceSession(guildId, userId, newChannelId, now);
      try {
        await endVoiceSessionDB.run(guildId, userId);
        await startVoiceSessionDB.run(guildId, userId, newChannelId, now);
        await VoiceRepo.insertVoiceActivity.run(guildId, userId, "MOVE", newChannelId, now);
        await VoiceRepo.cleanupOldVoiceActivity.run(guildId, userId, guildId, userId);
      } catch (err) {
        log.error("voiceStateUpdate", `Error al mover sesión de voz:`, err.message);
      }
    }


    if (oldChannelId && !newChannelId) {
      try {
        await VoiceRepo.insertVoiceActivity.run(guildId, userId, "LEAVE", oldChannelId, now);
        await VoiceRepo.cleanupOldVoiceActivity.run(guildId, userId, guildId, userId);
      } catch (err) {
        log.error("voiceStateUpdate", `Error al registrar salida de voz:`, err.message);
      }
    }

    const { updateVoiceModEmbed } = await import("../modules/moderation/voice/utils.js").catch((err) => {
      log.error("voiceStateUpdate", `Error al importar updateVoiceModEmbed:`, err.message);
      return {};
    });
    
    if (oldChannelId !== newChannelId) {
      if (oldChannelId) {
        const key = `${guildId}_${oldChannelId}`;
        if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
          await updateVoiceModEmbed(client, oldChannelId, guildId).catch((err) => {
            log.error("voiceStateUpdate", `Error al actualizar embed de moderación (canal anterior ${oldChannelId}) en ${guild.name}:`, err.message);
          });
        }
      }

      if (newChannelId) {
        const key = `${guildId}_${newChannelId}`;
        if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
          await updateVoiceModEmbed(client, newChannelId, guildId).catch((err) => {
            log.error("voiceStateUpdate", `Error al actualizar embed de moderación (canal nuevo ${newChannelId}) en ${guild.name}:`, err.message);
          });
        }
      }
    } else if (oldChannelId === newChannelId && oldChannelId) {
      const key = `${guildId}_${oldChannelId}`;
      if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
        const muteChanged = oldState.serverMute !== newState.serverMute || oldState.selfMute !== newState.selfMute;
        const deafChanged = oldState.serverDeaf !== newState.serverDeaf || oldState.selfDeaf !== newState.selfDeaf;
        if (muteChanged || deafChanged) {
          await updateVoiceModEmbed(client, oldChannelId, guildId).catch((err) => {
            log.error("voiceStateUpdate", `Error al actualizar embed de moderación (mute/deafen) en canal ${oldChannelId} de ${guild.name}:`, err.message);
          });
        }
      }
    }

    if (oldChannelId === newChannelId) return;

    const cfg = await getSettings.get(guild.id);
    const logId = cfg?.voice_log_channel_id;
    if (!logId) return;

    const logCh = await guild.channels.fetch(logId).catch((err) => {
      log.error("voiceStateUpdate", `Error al obtener canal de logs de voz ${logId} en ${guild.name}:`, err.message);
      return null;
    });
    if (!logCh?.isTextBased()) return;

    const embed = voiceStateEmbed(oldState, newState, sessionForEmbed);
    if (!embed) return;

    await logCh.send({ embeds: [embed] }).catch((err) => {
      log.error("voiceStateUpdate", `Error al enviar log de voz en ${guild.name}:`, err.message);
    });
  } catch (error) {
    log.error("voiceStateUpdate", "Error inesperado:", error.message);
  }
}


import { getSettings, startVoiceSession, endVoiceSession, getVoiceSession, incrementVoiceTime } from "../db.js";
import { voiceStateEmbed } from "../utils/embeds.js";

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
      const session = getVoiceSession.get(guildId, userId);
      if (session) {
        sessionForEmbed = session;
        const joinTime = session.join_timestamp;
        const durationSeconds = Math.floor((now - joinTime) / 1000);
        
        if (durationSeconds > 0) {
          try {
            incrementVoiceTime.run(guildId, userId, durationSeconds);
          } catch (err) {
            console.error(`[voiceStateUpdate] Error al incrementar tiempo de voz para ${member.user.tag} en ${guild.name}:`, err.message);
          }
        }
        
        try {
          endVoiceSession.run(guildId, userId);
        } catch (err) {
          console.error(`[voiceStateUpdate] Error al finalizar sesión de voz para ${member.user.tag} en ${guild.name}:`, err.message);
        }
      }
    }

    if (newChannelId) {
      try {
        startVoiceSession.run(guildId, userId, newChannelId, now);
      } catch (err) {
        console.error(`[voiceStateUpdate] Error al iniciar sesión de voz para ${member.user.tag} en ${guild.name}:`, err.message);
      }
    }

    const { updateVoiceModEmbed } = await import("../utils/voiceMod.js").catch((err) => {
      console.error(`[voiceStateUpdate] Error al importar updateVoiceModEmbed:`, err.message);
      return {};
    });
    
    if (oldChannelId !== newChannelId) {
      if (oldChannelId) {
        const key = `${guildId}_${oldChannelId}`;
        if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
          await updateVoiceModEmbed(client, oldChannelId, guildId).catch((err) => {
            console.error(`[voiceStateUpdate] Error al actualizar embed de moderación (canal anterior) en ${guild.name}:`, err.message);
          });
        }
      }

      if (newChannelId) {
        const key = `${guildId}_${newChannelId}`;
        if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
          await updateVoiceModEmbed(client, newChannelId, guildId).catch((err) => {
            console.error(`[voiceStateUpdate] Error al actualizar embed de moderación (canal nuevo) en ${guild.name}:`, err.message);
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
            console.error(`[voiceStateUpdate] Error al actualizar embed de moderación (mute/deafen) en ${guild.name}:`, err.message);
          });
        }
      }
    }

    if (oldChannelId === newChannelId) return;

    const cfg = getSettings.get(guild.id);
    const logId = cfg?.voice_log_channel_id;
    if (!logId) return;

    const logCh = await guild.channels.fetch(logId).catch((err) => {
      console.error(`[voiceStateUpdate] Error al obtener canal de logs de voz ${logId} en ${guild.name}:`, err.message);
      return null;
    });
    if (!logCh?.isTextBased()) return;

    const embed = voiceStateEmbed(oldState, newState, sessionForEmbed);
    if (!embed) return;

    await logCh.send({ embeds: [embed] }).catch((err) => {
      console.error(`[voiceStateUpdate] Error al enviar log de voz en ${guild.name}:`, err.message);
    });
  } catch (error) {
    console.error(`[voiceStateUpdate] Error inesperado:`, error.message);
  }
}


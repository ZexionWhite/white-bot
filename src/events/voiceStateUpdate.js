import { getSettings, startVoiceSession, endVoiceSession, getVoiceSession, incrementVoiceTime } from "../db.js";
import { voiceStateEmbed } from "../utils/embeds.js";

export default async function voiceStateUpdate(client, oldState, newState) {
  // Obtener miembro
  const member = newState.member ?? oldState.member;
  if (!member) return;

  // FILTRO DE BOTS: ignorar bots completamente
  if (member.user?.bot) return;

  // Solo procesar si hay un cambio relevante (join/leave/move)
  const oldChannelId = oldState.channel?.id ?? null;
  const newChannelId = newState.channel?.id ?? null;

  // Obtener configuración del servidor
  const guild = newState.guild ?? oldState.guild;
  if (!guild) return;

  const userId = member.id;
  const guildId = guild.id;
  const now = Date.now();

  // ===== TRACKEAR TIEMPO EN VOZ =====
  let sessionForEmbed = null;
  
  // Si salió de un canal (leave o move)
  if (oldChannelId) {
    const session = getVoiceSession.get(guildId, userId);
    if (session) {
      sessionForEmbed = session; // Guardar para el embed antes de eliminarla
      const joinTime = session.join_timestamp;
      const durationSeconds = Math.floor((now - joinTime) / 1000);
      
      // Solo incrementar si estuvo al menos 1 segundo (evitar spam)
      if (durationSeconds > 0) {
        incrementVoiceTime.run(guildId, userId, durationSeconds);
      }
      
      // Eliminar sesión
      endVoiceSession.run(guildId, userId);
    }
  }

  // Si entró a un canal (join o move)
  if (newChannelId) {
    startVoiceSession.run(guildId, userId, newChannelId, now);
  }

  // ===== ACTUALIZAR EMBEDS DE MODERACIÓN =====
  const { updateVoiceModEmbed } = await import("../utils/voiceMod.js").catch(() => ({}));
  
  // Si cambió el canal (join/leave/move)
  if (oldChannelId !== newChannelId) {
    // Actualizar embed del canal anterior
    if (oldChannelId) {
      const key = `${guildId}_${oldChannelId}`;
      if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
        await updateVoiceModEmbed(client, oldChannelId, guildId).catch(() => {});
      }
    }

    // Actualizar embed del canal nuevo
    if (newChannelId) {
      const key = `${guildId}_${newChannelId}`;
      if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
        await updateVoiceModEmbed(client, newChannelId, guildId).catch(() => {});
      }
    }
  } else if (oldChannelId === newChannelId && oldChannelId) {
    // Si está en el mismo canal pero cambió mute/deafen, actualizar también
    const key = `${guildId}_${oldChannelId}`;
    if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
      const muteChanged = oldState.mute !== newState.mute || oldState.selfMute !== newState.selfMute;
      const deafChanged = oldState.deaf !== newState.deaf || oldState.selfDeaf !== newState.selfDeaf;
      if (muteChanged || deafChanged) {
        await updateVoiceModEmbed(client, oldChannelId, guildId).catch(() => {});
      }
    }
  }

  // ===== LOGS (solo si cambió el canal) =====
  if (oldChannelId === newChannelId) return;

  const cfg = getSettings.get(guild.id);
  const logId = cfg?.voice_log_channel_id;
  if (!logId) return;

  // Obtener canal de logs
  const logCh = await guild.channels.fetch(logId).catch(() => null);
  if (!logCh?.isTextBased()) return;

  // Generar embed (incluye tiempo si salió)
  const embed = voiceStateEmbed(oldState, newState, sessionForEmbed);
  if (!embed) return;

  // Enviar log
  await logCh.send({ embeds: [embed] }).catch(() => {});
}


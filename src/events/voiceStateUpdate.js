import { getSettings, startVoiceSession, endVoiceSession, getVoiceSession, incrementVoiceTime } from "../db.js";
import { voiceStateEmbed } from "../utils/embeds.js";

export default async function voiceStateUpdate(client, oldState, newState) {
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
        incrementVoiceTime.run(guildId, userId, durationSeconds);
      }
      
      endVoiceSession.run(guildId, userId);
    }
  }

  if (newChannelId) {
    startVoiceSession.run(guildId, userId, newChannelId, now);
  }

  const { updateVoiceModEmbed } = await import("../utils/voiceMod.js").catch(() => ({}));
  
  if (oldChannelId !== newChannelId) {
    if (oldChannelId) {
      const key = `${guildId}_${oldChannelId}`;
      if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
        await updateVoiceModEmbed(client, oldChannelId, guildId).catch(() => {});
      }
    }

    if (newChannelId) {
      const key = `${guildId}_${newChannelId}`;
      if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
        await updateVoiceModEmbed(client, newChannelId, guildId).catch(() => {});
      }
    }
  } else if (oldChannelId === newChannelId && oldChannelId) {
    const key = `${guildId}_${oldChannelId}`;
    if (client.voiceModMessages.has(key) && updateVoiceModEmbed) {
      const muteChanged = oldState.mute !== newState.mute || oldState.selfMute !== newState.selfMute;
      const deafChanged = oldState.deaf !== newState.deaf || oldState.selfDeaf !== newState.selfDeaf;
      if (muteChanged || deafChanged) {
        await updateVoiceModEmbed(client, oldChannelId, guildId).catch(() => {});
      }
    }
  }

  if (oldChannelId === newChannelId) return;

  const cfg = getSettings.get(guild.id);
  const logId = cfg?.voice_log_channel_id;
  if (!logId) return;

  const logCh = await guild.channels.fetch(logId).catch(() => null);
  if (!logCh?.isTextBased()) return;

  const embed = voiceStateEmbed(oldState, newState, sessionForEmbed);
  if (!embed) return;

  await logCh.send({ embeds: [embed] }).catch(() => {});
}


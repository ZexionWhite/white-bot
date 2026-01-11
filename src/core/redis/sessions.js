import { get, set, del, expire } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

export const SESSION_KEYS = {
  voice: (guildId, userId) => `capy:session:voice:${guildId}:${userId}`,
  modal: (actionId) => `capy:session:modal:${actionId}`,
  confirmation: (guildId, userId, command) => `capy:session:confirm:${guildId}:${userId}:${command}`,
};

export const SESSION_TTL = {
  VOICE: 86400,        
  MODAL: 3600,         
  CONFIRMATION: 300,   
};

export async function getVoiceSession(guildId, userId) {
  const key = SESSION_KEYS.voice(guildId, userId);

  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const data = await get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    log.error("Sessions", `Error al obtener sesión de voz: ${error.message}`);
    return null;
  }
}

export async function setVoiceSession(guildId, userId, channelId, joinTimestamp) {
  const key = SESSION_KEYS.voice(guildId, userId);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    const data = JSON.stringify({ channel_id: channelId, join_timestamp: joinTimestamp });
    await set(key, data, SESSION_TTL.VOICE);
  } catch (error) {
    log.error("Sessions", `Error al guardar sesión de voz: ${error.message}`);
  }
}

export async function deleteVoiceSession(guildId, userId) {
  const key = SESSION_KEYS.voice(guildId, userId);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    await del(key);
  } catch (error) {
    log.error("Sessions", `Error al eliminar sesión de voz: ${error.message}`);
  }
}

export async function getModalSession(actionId) {
  const key = SESSION_KEYS.modal(actionId);

  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const data = await get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    log.error("Sessions", `Error al obtener sesión de modal: ${error.message}`);
    return null;
  }
}

export async function setModalSession(actionId, data) {
  const key = SESSION_KEYS.modal(actionId);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    await set(key, JSON.stringify(data), SESSION_TTL.MODAL);
  } catch (error) {
    log.error("Sessions", `Error al guardar sesión de modal: ${error.message}`);
  }
}

export async function deleteModalSession(actionId) {
  const key = SESSION_KEYS.modal(actionId);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    await del(key);
  } catch (error) {
    log.error("Sessions", `Error al eliminar sesión de modal: ${error.message}`);
  }
}

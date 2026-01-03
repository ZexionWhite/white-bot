/**
 * Sistema de sesiones temporales usando Redis
 * Usado para voice sessions, modals, confirmaciones, etc.
 * TTL automático para limpieza implícita
 */
import { get, set, del, expire } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

/**
 * Key patterns para diferentes tipos de sesiones
 */
export const SESSION_KEYS = {
  voice: (guildId, userId) => `capy:session:voice:${guildId}:${userId}`,
  modal: (actionId) => `capy:session:modal:${actionId}`,
  confirmation: (guildId, userId, command) => `capy:session:confirm:${guildId}:${userId}:${command}`,
};

/**
 * TTL por defecto para sesiones (en segundos)
 */
export const SESSION_TTL = {
  VOICE: 86400,        // 24 horas - sesiones de voz pueden durar mucho
  MODAL: 3600,         // 1 hora - modals deben resolverse rápido
  CONFIRMATION: 300,   // 5 minutos - confirmaciones deben ser rápidas
};

/**
 * Obtiene una sesión de voz
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<{channel_id: string, join_timestamp: number}|null>}
 */
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

/**
 * Establece una sesión de voz
 * @param {string} guildId
 * @param {string} userId
 * @param {string} channelId
 * @param {number} joinTimestamp
 * @returns {Promise<void>}
 */
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

/**
 * Elimina una sesión de voz
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<void>}
 */
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

/**
 * Obtiene datos de un modal pendiente
 * @param {string} actionId
 * @returns {Promise<object|null>}
 */
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

/**
 * Establece datos de un modal pendiente
 * @param {string} actionId
 * @param {object} data
 * @returns {Promise<void>}
 */
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

/**
 * Elimina datos de un modal pendiente
 * @param {string} actionId
 * @returns {Promise<void>}
 */
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

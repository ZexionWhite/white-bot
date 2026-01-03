/**
 * Manager centralizado de Webhooks para logging
 * Maneja creación, cache y validación de webhooks por canal
 */
import { get, set, del, isRedisAvailable } from "../redis/index.js";
import { log } from "../logger/index.js";

/**
 * Cache en memoria (fallback si Redis no está disponible)
 * Key: channelId -> { webhookId, webhookToken, avatar, username }
 */
const memoryCache = new Map();

/**
 * Key pattern para cache de webhooks
 */
function webhookCacheKey(channelId) {
  return `capy:webhook:${channelId}`;
}

/**
 * TTL para cache de webhooks (1 hora)
 */
const WEBHOOK_CACHE_TTL = 3600;

/**
 * Tipos de logs y sus configuraciones
 */
export const WEBHOOK_CONFIGS = {
  moderation: {
    username: "Moderation Logs",
    avatar: null, // Por defecto, usar avatar del bot
  },
  blacklist: {
    username: "Blacklist Logs",
    avatar: null,
  },
  message: {
    username: "Message Logs",
    avatar: null,
  },
  voice: {
    username: "Voice Logs",
    avatar: null,
  },
  user: {
    username: "User Logs",
    avatar: null,
  },
  join: {
    username: "Join Logs",
    avatar: null,
  },
};

/**
 * Obtiene o crea un webhook para un canal
 * @param {import("discord.js").GuildTextBasedChannel} channel - Canal donde crear/obtener el webhook
 * @param {string} type - Tipo de log (moderation, blacklist, message, voice, user, join)
 * @returns {Promise<{id: string, token: string}|null>}
 */
export async function getOrCreateWebhook(channel, type = "moderation") {
  if (!channel?.isTextBased() || channel.isDMBased()) {
    return null;
  }

  const channelId = channel.id;
  const cacheKey = webhookCacheKey(channelId);

  // Intentar obtener de cache (Redis o memoria)
  let cached = null;
  if (isRedisAvailable()) {
    try {
      const cachedStr = await get(cacheKey);
      if (cachedStr) {
        cached = JSON.parse(cachedStr);
      }
    } catch (error) {
      log.debug("Webhooks", `Error al obtener webhook de Redis: ${error.message}`);
    }
  } else {
    cached = memoryCache.get(channelId);
  }

  // Si tenemos cache, validar que el webhook existe
  if (cached) {
    try {
      // Intentar obtener el webhook para validarlo
      const webhook = await channel.client.fetchWebhook(cached.id, cached.token).catch(() => null);
      if (webhook) {
        return { id: cached.id, token: cached.token };
      }
    } catch (error) {
      // Webhook inválido, continuar para crear uno nuevo
      log.debug("Webhooks", `Webhook cacheado inválido, recreando: ${error.message}`);
    }
    // Si llegamos aquí, el webhook no existe, limpiar cache
    await invalidateWebhookCache(channelId);
  }

  // Intentar buscar webhook existente del bot
  try {
    const webhooks = await channel.fetchWebhooks();
    const botWebhook = webhooks.find(w => w.applicationId === channel.client.user.id);
    if (botWebhook && botWebhook.token) {
      const data = { id: botWebhook.id, token: botWebhook.token };
      await setWebhookCache(channelId, data);
      return data;
    }
  } catch (error) {
    log.debug("Webhooks", `Error al buscar webhooks existentes: ${error.message}`);
    // Continuar para crear uno nuevo
  }

  // Crear nuevo webhook
  try {
    const config = WEBHOOK_CONFIGS[type] || WEBHOOK_CONFIGS.moderation;
    const webhook = await channel.createWebhook({
      name: config.username,
      avatar: config.avatar || undefined,
      reason: "Sistema de logging del bot",
    });

    if (!webhook.token) {
      log.error("Webhooks", `Webhook creado sin token para canal ${channel.name}`);
      return null;
    }

    const data = { id: webhook.id, token: webhook.token };
    await setWebhookCache(channelId, data);
    log.info("Webhooks", `Webhook creado para canal ${channel.name} (${channelId})`);
    return data;
  } catch (error) {
    log.error("Webhooks", `Error al crear webhook en canal ${channel.name}: ${error.message}`);
    // No hacer throw: el sistema de fallback manejará esto
    return null;
  }
}

/**
 * Guarda webhook en cache
 * @param {string} channelId
 * @param {object} data
 */
async function setWebhookCache(channelId, data) {
  const cacheKey = webhookCacheKey(channelId);
  
  if (isRedisAvailable()) {
    try {
      await set(cacheKey, JSON.stringify(data), WEBHOOK_CACHE_TTL);
    } catch (error) {
      log.debug("Webhooks", `Error al guardar webhook en Redis: ${error.message}`);
    }
  }
  
  // Siempre guardar en memoria también (fallback)
  memoryCache.set(channelId, data);
}

/**
 * Invalida cache de webhook
 * @param {string} channelId
 */
export async function invalidateWebhookCache(channelId) {
  const cacheKey = webhookCacheKey(channelId);
  
  if (isRedisAvailable()) {
    try {
      await del(cacheKey);
    } catch (error) {
      log.debug("Webhooks", `Error al eliminar webhook de Redis: ${error.message}`);
    }
  }
  
  memoryCache.delete(channelId);
}

/**
 * Verifica permisos necesarios para webhooks
 * @param {import("discord.js").GuildTextBasedChannel} channel
 * @returns {Promise<boolean>}
 */
export async function hasWebhookPermissions(channel) {
  if (!channel?.guild?.members?.me) {
    return false;
  }

  const permissions = channel.permissionsFor(channel.guild.members.me);
  return permissions?.has([
    "ManageWebhooks",
    "ViewChannel",
    "SendMessages",
  ]) ?? false;
}

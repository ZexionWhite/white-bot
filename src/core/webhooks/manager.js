import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { get, set, del, isRedisAvailable } from "../redis/index.js";
import { log } from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ASSETS_WEBHOOKS_DIR = join(__dirname, "../../assets/webhooks");

const memoryCache = new Map();

function webhookCacheKey(channelId) {
  return `capy:webhook:${channelId}`;
}

const WEBHOOK_CACHE_TTL = 3600;

function loadWebhookAvatar(filename) {
  if (!filename) return null;
  
  try {
    const filePath = join(ASSETS_WEBHOOKS_DIR, filename);
    if (!existsSync(filePath)) {
      log.debug("Webhooks", `Avatar no encontrado: ${filePath}`);
      return null;
    }
    
    const buffer = readFileSync(filePath);
    const mimeType = filename.endsWith('.png') ? 'image/png' : 
                     filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' :
                     filename.endsWith('.gif') ? 'image/gif' : 'image/png';
    
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    log.debug("Webhooks", `Error al cargar avatar ${filename}: ${error.message}`);
    return null;
  }
}

export const WEBHOOK_CONFIGS = {
  moderation: {
    username: "CapyGuard",
    avatar: loadWebhookAvatar("guard.png") || loadWebhookAvatar("guard.jpg") || loadWebhookAvatar("guard.gif") 
  },
  blacklist: {
    username: "CapyGuard",
    avatar: loadWebhookAvatar("guard.png") || loadWebhookAvatar("guard.jpg") || loadWebhookAvatar("guard.gif") 
  },
  message: {
    username: "CapyLogger",
    avatar: loadWebhookAvatar("logger.png") || loadWebhookAvatar("logger.jpg") || loadWebhookAvatar("logger.gif") 
  },
  voice: {
    username: "CapyLogger",
    avatar: loadWebhookAvatar("logger.png") || loadWebhookAvatar("logger.jpg") || loadWebhookAvatar("logger.gif") 
  },
  user: {
    username: "CapyLogger",
    avatar: loadWebhookAvatar("logger.png") || loadWebhookAvatar("logger.jpg") || loadWebhookAvatar("logger.gif") 
  },
  join: {
    username: "CapyLogger",
    avatar: loadWebhookAvatar("logger.png") || loadWebhookAvatar("logger.jpg") || loadWebhookAvatar("logger.gif") 
  },
  default: {
    username: "capybot",
    avatar: null 
  }
};

export async function getOrCreateWebhook(channel, type = "moderation") {
  if (!channel?.isTextBased() || channel.isDMBased()) {
    return null;
  }

  const channelId = channel.id;
  const cacheKey = webhookCacheKey(channelId);

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

  if (cached) {
    try {
      
      const webhook = await channel.client.fetchWebhook(cached.id, cached.token).catch(() => null);
      if (webhook) {
        return { id: cached.id, token: cached.token };
      }
    } catch (error) {
      
      log.debug("Webhooks", `Webhook cacheado inválido, recreando: ${error.message}`);
    }
    
    await invalidateWebhookCache(channelId);
  }

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
    
  }

  try {
    const config = WEBHOOK_CONFIGS[type] || WEBHOOK_CONFIGS.default || WEBHOOK_CONFIGS.moderation;
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
    
    return null;
  }
}

async function setWebhookCache(channelId, data) {
  const cacheKey = webhookCacheKey(channelId);
  
  if (isRedisAvailable()) {
    try {
      await set(cacheKey, JSON.stringify(data), WEBHOOK_CACHE_TTL);
    } catch (error) {
      log.debug("Webhooks", `Error al guardar webhook en Redis: ${error.message}`);
    }
  }

  memoryCache.set(channelId, data);
}

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

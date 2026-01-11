import Redis from "ioredis";
import { log } from "../logger/index.js";
import { getConfig } from "../config/index.js";

let redisClient = null;
let redisEnabled = false;
let connectionAttempted = false;

export async function initRedis() {
  if (connectionAttempted) {
    return redisEnabled;
  }

  connectionAttempted = true;

  try {
    const config = getConfig();
    const useRedis = config.USE_REDIS === "true" || config.USE_REDIS === true;
    
    if (!useRedis) {
      log.info("Redis", "Redis deshabilitado (USE_REDIS=false o no configurado)");
      return false;
    }

    const redisUrl = config.REDIS_URL || process.env.REDIS_URL;
    
    if (!redisUrl) {
      log.warn("Redis", "USE_REDIS=true pero REDIS_URL no está configurado. Redis deshabilitado.");
      return false;
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true; 
        }
        return false;
      },
      enableOfflineQueue: false, 
    });

    redisClient.on("connect", () => {
      log.info("Redis", "Conectado a Redis");
      redisEnabled = true;
    });

    redisClient.on("ready", () => {
      log.info("Redis", "Redis listo para recibir comandos");
      redisEnabled = true;
    });

    redisClient.on("error", (err) => {
      log.error("Redis", `Error de Redis: ${err.message}`);
      redisEnabled = false;
      
    });

    redisClient.on("close", () => {
      log.warn("Redis", "Conexión a Redis cerrada");
      redisEnabled = false;
    });

    redisClient.on("reconnecting", (ms) => {
      log.info("Redis", `Reconectando a Redis en ${ms}ms...`);
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        log.warn("Redis", "Timeout esperando conexión a Redis (5s). El bot continuará sin Redis.");
        redisEnabled = false;
        resolve(false);
      }, 5000);

      redisClient.once("ready", async () => {
        clearTimeout(timeout);
        try {
          
          await redisClient.ping();
          redisEnabled = true;
          log.info("Redis", "Redis inicializado correctamente");
          resolve(true);
        } catch (error) {
          log.warn("Redis", `Error en ping de Redis: ${error.message}. El bot continuará sin Redis.`);
          redisEnabled = false;
          resolve(false);
        }
      });

      redisClient.once("error", (err) => {
        clearTimeout(timeout);
        
        redisEnabled = false;
        resolve(false);
      });
    });
  } catch (error) {
    log.warn("Redis", `No se pudo conectar a Redis: ${error.message}. El bot continuará sin Redis.`);
    redisEnabled = false;

    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        
      }
      redisClient = null;
    }
    
    return false;
  }
}

export function isRedisAvailable() {
  return redisEnabled && redisClient && redisClient.status === "ready";
}

export function getRedisClient() {
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      log.info("Redis", "Conexión a Redis cerrada");
    } catch (error) {
      log.error("Redis", `Error al cerrar Redis: ${error.message}`);
    } finally {
      redisClient = null;
      redisEnabled = false;
    }
  }
}

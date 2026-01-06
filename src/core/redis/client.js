/**
 * Cliente Redis con reconexión automática y fallback seguro
 * Redis es opcional: el bot funciona sin Redis usando solo PostgreSQL
 */
import Redis from "ioredis";
import { log } from "../logger/index.js";
import { getConfig } from "../config/index.js";

let redisClient = null;
let redisEnabled = false;
let connectionAttempted = false;

/**
 * Inicializa el cliente Redis
 * @returns {Promise<boolean>} true si Redis está disponible, false en caso contrario
 */
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
          return true; // Reconectar en caso de error READONLY
        }
        return false;
      },
      enableOfflineQueue: false, // No acumular comandos si está offline
    });

    // Event listeners
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
      // No hacer throw: el bot debe continuar funcionando sin Redis
    });

    redisClient.on("close", () => {
      log.warn("Redis", "Conexión a Redis cerrada");
      redisEnabled = false;
    });

    redisClient.on("reconnecting", (ms) => {
      log.info("Redis", `Reconectando a Redis en ${ms}ms...`);
    });

    // Esperar a que Redis esté listo antes de hacer ping
    // ioredis se conecta automáticamente, pero debemos esperar el evento "ready"
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        log.warn("Redis", "Timeout esperando conexión a Redis (5s). El bot continuará sin Redis.");
        redisEnabled = false;
        resolve(false);
      }, 5000);

      redisClient.once("ready", async () => {
        clearTimeout(timeout);
        try {
          // Test de conexión
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
        // El error ya se maneja en el listener general, solo resolvemos
        redisEnabled = false;
        resolve(false);
      });
    });
  } catch (error) {
    log.warn("Redis", `No se pudo conectar a Redis: ${error.message}. El bot continuará sin Redis.`);
    redisEnabled = false;
    
    // Cerrar cliente si existe
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      redisClient = null;
    }
    
    return false;
  }
}

/**
 * Verifica si Redis está disponible y conectado
 * @returns {boolean}
 */
export function isRedisAvailable() {
  return redisEnabled && redisClient && redisClient.status === "ready";
}

/**
 * Obtiene el cliente Redis (puede ser null si no está disponible)
 * @returns {Redis|null}
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Cierra la conexión a Redis
 */
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

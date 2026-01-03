/**
 * Sistema de rate limiting usando Redis
 * Contadores atómicos con TTL automático
 */
import { get, set, incr, expire, exists } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

/**
 * Key pattern para rate limits
 * @param {string} type - Tipo de rate limit (user, guild, command, etc.)
 * @param {string} identifier - Identificador único (userId, guildId, etc.)
 * @param {string} resource - Recurso limitado (command name, event, etc.)
 * @returns {string}
 */
function rateLimitKey(type, identifier, resource) {
  return `capy:ratelimit:${type}:${identifier}:${resource}`;
}

/**
 * Configuraciones de rate limits predefinidas
 */
export const RATE_LIMITS = {
  // Rate limits por usuario
  USER_COMMAND: { max: 10, window: 60 },        // 10 comandos por minuto por usuario
  USER_MESSAGE: { max: 30, window: 60 },        // 30 mensajes por minuto por usuario
  USER_INTERACTION: { max: 20, window: 60 },    // 20 interacciones por minuto por usuario
  
  // Rate limits por guild
  GUILD_WELCOME: { max: 5, window: 60 },        // 5 welcomes por minuto por guild
  GUILD_LOG: { max: 50, window: 60 },           // 50 logs por minuto por guild
  
  // Rate limits globales (sin identificador)
  GLOBAL_API: { max: 1000, window: 60 },        // 1000 requests por minuto global
};

/**
 * Verifica si se excedió el rate limit
 * @param {string} type - Tipo de rate limit
 * @param {string} identifier - Identificador único
 * @param {string} resource - Recurso limitado
 * @param {number} max - Máximo de requests permitidos
 * @param {number} windowSeconds - Ventana de tiempo en segundos
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
export async function checkRateLimit(type, identifier, resource, max, windowSeconds) {
  const key = rateLimitKey(type, identifier, resource);

  if (!isRedisAvailable()) {
    // Sin Redis: permitir todas las requests (fallback permissivo)
    return {
      allowed: true,
      remaining: max,
      resetAt: Date.now() + (windowSeconds * 1000),
    };
  }

  try {
    const existsKey = await exists(key);
    
    if (!existsKey) {
      // Primera request: inicializar contador
      await set(key, "1", windowSeconds);
      return {
        allowed: true,
        remaining: max - 1,
        resetAt: Date.now() + (windowSeconds * 1000),
      };
    }

    // Incrementar contador atómico
    const count = await incr(key);
    
    if (count === 1) {
      // Si era 0 y ahora es 1, establecer TTL
      await expire(key, windowSeconds);
    }

    const allowed = count <= max;
    const remaining = Math.max(0, max - count);

    // Calcular resetAt (aproximado basado en TTL restante)
    const resetAt = Date.now() + (windowSeconds * 1000);

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    log.error("RateLimit", `Error al verificar rate limit: ${error.message}`);
    // Fallback permissivo en caso de error
    return {
      allowed: true,
      remaining: max,
      resetAt: Date.now() + (windowSeconds * 1000),
    };
  }
}

/**
 * Verifica rate limit usando una configuración predefinida
 * @param {string} configName - Nombre de la configuración (ej: "USER_COMMAND")
 * @param {string} identifier - Identificador único
 * @param {string} resource - Recurso limitado (opcional, puede ser el command name)
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
export async function checkRateLimitConfig(configName, identifier, resource = "default") {
  const config = RATE_LIMITS[configName];
  if (!config) {
    log.warn("RateLimit", `Configuración de rate limit no encontrada: ${configName}`);
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: Date.now() + 60000,
    };
  }

  const type = configName.startsWith("USER_") ? "user" : 
               configName.startsWith("GUILD_") ? "guild" : "global";

  return checkRateLimit(type, identifier, resource, config.max, config.window);
}

/**
 * Resetea un rate limit (útil para testing o casos especiales)
 * @param {string} type
 * @param {string} identifier
 * @param {string} resource
 * @returns {Promise<void>}
 */
export async function resetRateLimit(type, identifier, resource) {
  const key = rateLimitKey(type, identifier, resource);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    await del(key);
  } catch (error) {
    log.error("RateLimit", `Error al resetear rate limit: ${error.message}`);
  }
}

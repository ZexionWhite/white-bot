import { get, set, incr, expire, exists } from "./helpers.js";
import { isRedisAvailable } from "./client.js";
import { log } from "../logger/index.js";

function rateLimitKey(type, identifier, resource) {
  return `capy:ratelimit:${type}:${identifier}:${resource}`;
}

export const RATE_LIMITS = {
  
  USER_COMMAND: { max: 10, window: 60 },        
  USER_MESSAGE: { max: 30, window: 60 },        
  USER_INTERACTION: { max: 20, window: 60 },    

  GUILD_WELCOME: { max: 5, window: 60 },        
  GUILD_LOG: { max: 50, window: 60 },           

  GLOBAL_API: { max: 1000, window: 60 },        
};

export async function checkRateLimit(type, identifier, resource, max, windowSeconds) {
  const key = rateLimitKey(type, identifier, resource);

  if (!isRedisAvailable()) {
    
    return {
      allowed: true,
      remaining: max,
      resetAt: Date.now() + (windowSeconds * 1000),
    };
  }

  try {
    const existsKey = await exists(key);
    
    if (!existsKey) {
      
      await set(key, "1", windowSeconds);
      return {
        allowed: true,
        remaining: max - 1,
        resetAt: Date.now() + (windowSeconds * 1000),
      };
    }

    const count = await incr(key);
    
    if (count === 1) {
      
      await expire(key, windowSeconds);
    }

    const allowed = count <= max;
    const remaining = Math.max(0, max - count);

    const resetAt = Date.now() + (windowSeconds * 1000);

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    log.error("RateLimit", `Error al verificar rate limit: ${error.message}`);
    
    return {
      allowed: true,
      remaining: max,
      resetAt: Date.now() + (windowSeconds * 1000),
    };
  }
}

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

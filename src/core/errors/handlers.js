/**
 * Helpers para manejo de errores consistente
 */

import { log } from "../logger/index.js";
import { BotError } from "./index.js";

/**
 * Wrapper para manejar errores de forma consistente en funciones async
 * @param {Function} fn - Función async a ejecutar
 * @param {string} context - Contexto para logging (ej: "moderation.service", "userinfo.handler")
 * @param {*} defaultValue - Valor por defecto a retornar si hay error (opcional)
 * @returns {Promise<*>} Resultado de la función o defaultValue si hay error
 */
export async function handleError(fn, context, defaultValue = null) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof BotError) {
      log.error(context, `${error.name} (${error.code}):`, error.message);
    } else {
      log.error(context, "Error inesperado:", error.message, error.stack);
    }
    return defaultValue;
  }
}

/**
 * Wrapper que lanza el error en lugar de retornar defaultValue
 * Útil cuando el error debe propagarse
 * @param {Function} fn - Función async a ejecutar
 * @param {string} context - Contexto para logging
 * @returns {Promise<*>} Resultado de la función
 * @throws {Error} El error original si ocurre
 */
export async function handleErrorAndThrow(fn, context) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof BotError) {
      log.error(context, `${error.name} (${error.code}):`, error.message);
    } else {
      log.error(context, "Error inesperado:", error.message);
    }
    throw error;
  }
}

/**
 * Convierte un error genérico a BotError si no lo es ya
 * @param {Error} error - Error a normalizar
 * @param {string} code - Código de error
 * @returns {BotError}
 */
export function normalizeError(error, code = "UNKNOWN_ERROR") {
  if (error instanceof BotError) {
    return error;
  }
  const botError = new BotError(error.message || "Error desconocido", code);
  botError.stack = error.stack;
  return botError;
}

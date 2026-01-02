/**
 * Error base y helpers para el bot
 */

// Importar BotError desde archivo base para evitar dependencias circulares
import { BotError } from "./base.error.js";

// Re-exportar BotError
export { BotError };

/**
 * Error de configuración
 */
export class ConfigError extends BotError {
  constructor(message) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

/**
 * Error de validación
 */
export class ValidationError extends BotError {
  constructor(message, field) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Helper para crear errores con contexto
 */
export function createError(message, code, context = {}) {
  const error = new BotError(message, code);
  Object.assign(error, context);
  return error;
}

// Re-exportar errores específicos
export * from "./database.error.js";
export * from "./discord.error.js";

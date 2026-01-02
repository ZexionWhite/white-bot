/**
 * Error base y helpers para el bot
 */

/**
 * Error base para errores del bot
 */
export class BotError extends Error {
  constructor(message, code = "BOT_ERROR") {
    super(message);
    this.name = "BotError";
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

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

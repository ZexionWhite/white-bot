/**
 * Error base para errores del bot
 */

/**
 * Error base para errores del bot
 */
export class BotError extends Error {
  constructor(message, code = "BOT_ERROR") {
    super(message);
    this.name = "BotError";
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

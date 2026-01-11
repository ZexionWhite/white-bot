import { BotError } from "./base.error.js";

export { BotError };

export class ConfigError extends BotError {
  constructor(message) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

export class ValidationError extends BotError {
  constructor(message, field) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

export function createError(message, code, context = {}) {
  const error = new BotError(message, code);
  Object.assign(error, context);
  return error;
}

export * from "./database.error.js";
export * from "./discord.error.js";

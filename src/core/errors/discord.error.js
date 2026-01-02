/**
 * Errores relacionados con Discord API
 */

import { BotError } from "./index.js";

/**
 * Error de permisos de Discord
 */
export class DiscordPermissionError extends BotError {
  constructor(message, permission = null, guildId = null) {
    super(message, "DISCORD_PERMISSION_ERROR");
    this.name = "DiscordPermissionError";
    this.permission = permission;
    this.guildId = guildId;
  }
}

/**
 * Error de rate limit de Discord
 */
export class DiscordRateLimitError extends BotError {
  constructor(message, retryAfter = null) {
    super(message, "DISCORD_RATE_LIMIT_ERROR");
    this.name = "DiscordRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Error de recurso no encontrado en Discord
 */
export class DiscordNotFoundError extends BotError {
  constructor(message, resourceType = null, resourceId = null) {
    super(message, "DISCORD_NOT_FOUND_ERROR");
    this.name = "DiscordNotFoundError";
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

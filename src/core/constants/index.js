/**
 * Constantes comunes del bot
 */

/** Prefijo por defecto para comandos (preparado para Fase 1) */
export const DEFAULT_PREFIX = "!";

/** Límites comunes */
export const LIMITS = {
  /** Máximo de caracteres en un mensaje de Discord */
  MESSAGE_MAX_LENGTH: 2000,
  /** Máximo de opciones en un select menu */
  SELECT_MENU_MAX_OPTIONS: 25,
  /** Cooldown por defecto para welcome (en minutos) */
  WELCOME_DEFAULT_COOLDOWN: 60
};

/** Niveles de log */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

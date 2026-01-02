/**
 * Logger simple con niveles para el bot
 */
import { LOG_LEVELS } from "../constants/index.js";

/**
 * Logger principal del bot
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || "INFO";
    this.levelValue = this.getLevelValue(this.level);
  }

  /**
   * Obtiene el valor numérico de un nivel
   */
  getLevelValue(level) {
    const upper = level.toUpperCase();
    return LOG_LEVELS[upper] ?? LOG_LEVELS.INFO;
  }

  /**
   * Formatea el mensaje con nivel y prefijo
   */
  formatMessage(level, prefix, message) {
    const prefixStr = prefix ? `[${prefix}] ` : "";
    return `${prefixStr}${message}`;
  }

  /**
   * Log de error
   */
  error(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage("ERROR", prefix, message);
      console.error(formatted, ...args);
    }
  }

  /**
   * Log de advertencia
   */
  warn(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage("WARN", prefix, message);
      console.warn(formatted, ...args);
    }
  }

  /**
   * Log de información
   */
  info(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage("INFO", prefix, message);
      console.log(formatted, ...args);
    }
  }

  /**
   * Log de debug
   */
  debug(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage("DEBUG", prefix, message);
      console.log(formatted, ...args);
    }
  }

  /**
   * Log sin formato (para casos especiales como banners)
   */
  raw(message) {
    console.log(message);
  }
}

// Instancia singleton
export const logger = new Logger();

// Exportar métodos directos para facilitar el uso
export const log = {
  error: (prefix, message, ...args) => logger.error(prefix, message, ...args),
  warn: (prefix, message, ...args) => logger.warn(prefix, message, ...args),
  info: (prefix, message, ...args) => logger.info(prefix, message, ...args),
  debug: (prefix, message, ...args) => logger.debug(prefix, message, ...args),
  raw: (message) => logger.raw(message)
};

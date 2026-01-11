import { LOG_LEVELS } from "../constants/index.js";

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || "INFO";
    this.levelValue = this.getLevelValue(this.level);
  }

  getLevelValue(level) {
    const upper = level.toUpperCase();
    return LOG_LEVELS[upper] ?? LOG_LEVELS.INFO;
  }

  formatMessage(level, prefix, message) {
    const prefixStr = prefix ? `[${prefix}] ` : "";
    return `${prefixStr}${message}`;
  }

  error(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage("ERROR", prefix, message);
      console.error(formatted, ...args);
    }
  }

  warn(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage("WARN", prefix, message);
      console.warn(formatted, ...args);
    }
  }

  info(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage("INFO", prefix, message);
      console.log(formatted, ...args);
    }
  }

  debug(prefix, message, ...args) {
    if (this.levelValue >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage("DEBUG", prefix, message);
      console.log(formatted, ...args);
    }
  }

  raw(message) {
    console.log(message);
  }
}

export const logger = new Logger();

export const log = {
  error: (prefix, message, ...args) => logger.error(prefix, message, ...args),
  warn: (prefix, message, ...args) => logger.warn(prefix, message, ...args),
  info: (prefix, message, ...args) => logger.info(prefix, message, ...args),
  debug: (prefix, message, ...args) => logger.debug(prefix, message, ...args),
  raw: (message) => logger.raw(message)
};

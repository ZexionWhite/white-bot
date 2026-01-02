/**
 * Errores relacionados con la base de datos
 */

import { BotError } from "./index.js";

/**
 * Error de conexión a la base de datos
 */
export class DatabaseConnectionError extends BotError {
  constructor(message, driver = "unknown") {
    super(message, "DATABASE_CONNECTION_ERROR");
    this.name = "DatabaseConnectionError";
    this.driver = driver;
  }
}

/**
 * Error de query SQL
 */
export class DatabaseQueryError extends BotError {
  constructor(message, query = null, params = null) {
    super(message, "DATABASE_QUERY_ERROR");
    this.name = "DatabaseQueryError";
    this.query = query;
    this.params = params;
  }
}

/**
 * Error de integridad de datos (constraints, foreign keys, etc.)
 */
export class DatabaseIntegrityError extends BotError {
  constructor(message, constraint = null) {
    super(message, "DATABASE_INTEGRITY_ERROR");
    this.name = "DatabaseIntegrityError";
    this.constraint = constraint;
  }
}

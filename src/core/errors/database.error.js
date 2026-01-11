import { BotError } from "./base.error.js";

export class DatabaseConnectionError extends BotError {
  constructor(message, driver = "unknown") {
    super(message, "DATABASE_CONNECTION_ERROR");
    this.name = "DatabaseConnectionError";
    this.driver = driver;
  }
}

export class DatabaseQueryError extends BotError {
  constructor(message, query = null, params = null) {
    super(message, "DATABASE_QUERY_ERROR");
    this.name = "DatabaseQueryError";
    this.query = query;
    this.params = params;
  }
}

export class DatabaseIntegrityError extends BotError {
  constructor(message, constraint = null) {
    super(message, "DATABASE_INTEGRITY_ERROR");
    this.name = "DatabaseIntegrityError";
    this.constraint = constraint;
  }
}

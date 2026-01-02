/**
 * Adaptador para SQLite usando better-sqlite3
 * Implementa la interfaz DatabaseDriver manteniendo compatibilidad total
 */

import Database from "better-sqlite3";
import { DatabaseDriver, PreparedStatement } from "./interface.js";

/**
 * Wrapper para prepared statements de better-sqlite3
 */
class SQLitePreparedStatement extends PreparedStatement {
  constructor(stmt) {
    super();
    this.stmt = stmt;
  }

  run(...params) {
    try {
      return this.stmt.run(...params);
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  get(...params) {
    try {
      return this.stmt.get(...params);
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  all(...params) {
    try {
      return this.stmt.all(...params);
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  wrapError(error) {
    // Mantener el error original pero añadir contexto
    error.driver = "sqlite";
    return error;
  }
}

/**
 * Driver SQLite que implementa DatabaseDriver
 */
export class SQLiteDriver extends DatabaseDriver {
  /**
   * @param {string|Database} dbPathOrInstance - Ruta al archivo DB o instancia de Database
   */
  constructor(dbPathOrInstance) {
    super();
    
    if (typeof dbPathOrInstance === "string") {
      this.db = new Database(dbPathOrInstance);
    } else if (dbPathOrInstance instanceof Database) {
      // Permitir pasar una instancia existente para compatibilidad
      this.db = dbPathOrInstance;
    } else {
      throw new Error("SQLiteDriver requiere una ruta (string) o instancia de Database");
    }

    // Exponer el db original para compatibilidad con código existente
    this.native = this.db;
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return new SQLitePreparedStatement(stmt);
  }

  exec(sql) {
    try {
      this.db.exec(sql);
    } catch (error) {
      error.driver = "sqlite";
      throw error;
    }
  }

  transaction(callback) {
    // better-sqlite3 tiene soporte nativo para transacciones
    return this.db.transaction(callback);
  }

  close() {
    this.db.close();
  }

  /**
   * Método helper para obtener información de la tabla (SQLite específico)
   * Útil para ensureColumn y otras operaciones de esquema
   */
  pragmaTableInfo(table) {
    const stmt = this.db.prepare(`PRAGMA table_info('${table}')`);
    return stmt.all();
  }
}

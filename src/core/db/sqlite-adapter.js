import Database from "better-sqlite3";
import { DatabaseDriver, PreparedStatement } from "./interface.js";

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
    
    error.driver = "sqlite";
    return error;
  }
}

export class SQLiteDriver extends DatabaseDriver {

  constructor(dbPathOrInstance) {
    super();
    
    if (typeof dbPathOrInstance === "string") {
      this.db = new Database(dbPathOrInstance);
    } else if (dbPathOrInstance instanceof Database) {
      
      this.db = dbPathOrInstance;
    } else {
      throw new Error("SQLiteDriver requiere una ruta (string) o instancia de Database");
    }

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
    
    return this.db.transaction(callback);
  }

  close() {
    this.db.close();
  }

  pragmaTableInfo(table) {
    const stmt = this.db.prepare(`PRAGMA table_info('${table}')`);
    return stmt.all();
  }
}

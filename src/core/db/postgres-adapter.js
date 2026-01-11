import pg from "pg";
const { Pool, Client } = pg;
import { DatabaseDriver, PreparedStatement } from "./interface.js";
import { DatabaseQueryError, DatabaseConnectionError } from "../errors/database.error.js";
import { log } from "../logger/index.js";

class PostgresPreparedStatement extends PreparedStatement {
  constructor(pool, sql) {
    super();
    this.pool = pool;
    this.sql = sql;
  }

  convertParams(sql, params) {
    let paramIndex = 1;
    const values = [];
    const convertedSql = sql.replace(/\?/g, () => {
      values.push(params[paramIndex - 1]);
      return `$${paramIndex++}`;
    });
    return { sql: convertedSql, values };
  }

  convertNamedParams(sql, paramsObj) {
    const values = [];
    const paramMap = new Map();
    let paramIndex = 1;

    const namedParamRegex = /@(\w+)/g;
    const convertedSql = sql.replace(namedParamRegex, (match, paramName) => {
      if (!paramMap.has(paramName)) {
        paramMap.set(paramName, paramIndex++);
        values.push(paramsObj[paramName]);
      }
      return `$${paramMap.get(paramName)}`;
    });

    return { sql: convertedSql, values };
  }

  async run(...params) {
    try {
      let sql = this.sql;
      let values = [];

      if (this.sql.includes("@") && typeof params[0] === "object" && params.length === 1) {
        const converted = this.convertNamedParams(this.sql, params[0]);
        sql = converted.sql;
        values = converted.values;
      } else {
        const converted = this.convertParams(this.sql, params);
        sql = converted.sql;
        values = converted.values;
      }

      const result = await this.pool.query(sql, values);

      let lastInsertRowid = null;
      if (sql.trim().toUpperCase().includes('RETURNING')) {
        lastInsertRowid = result.rows[0]?.id || result.rows[0]?.ID || null;
      } else if (result.rows && result.rows.length > 0) {
        
        lastInsertRowid = result.rows[0]?.id || result.rows[0]?.ID || null;
      }
      
      return {
        lastInsertRowid,
        changes: result.rowCount || 0
      };
    } catch (error) {
      throw new DatabaseQueryError(error.message, this.sql, params);
    }
  }

  async get(...params) {
    try {
      let sql = this.sql;
      let values = [];

      if (this.sql.includes("@") && typeof params[0] === "object" && params.length === 1) {
        const converted = this.convertNamedParams(this.sql, params[0]);
        sql = converted.sql;
        values = converted.values;
      } else {
        const converted = this.convertParams(this.sql, params);
        sql = converted.sql;
        values = converted.values;
      }

      const result = await this.pool.query(sql, values);
      return result.rows[0] || undefined;
    } catch (error) {
      throw new DatabaseQueryError(error.message, this.sql, params);
    }
  }

  async all(...params) {
    try {
      let sql = this.sql;
      let values = [];

      if (this.sql.includes("@") && typeof params[0] === "object" && params.length === 1) {
        const converted = this.convertNamedParams(this.sql, params[0]);
        sql = converted.sql;
        values = converted.values;
      } else {
        const converted = this.convertParams(this.sql, params);
        sql = converted.sql;
        values = converted.values;
      }

      const result = await this.pool.query(sql, values);
      return result.rows;
    } catch (error) {
      throw new DatabaseQueryError(error.message, this.sql, params);
    }
  }
}

export class PostgresDriver extends DatabaseDriver {

  constructor(connectionString, poolConfig = {}) {
    super();
    
    if (!connectionString) {
      throw new DatabaseConnectionError("Connection string de PostgreSQL es requerida");
    }

    const defaultPoolConfig = {
      connectionString,
      max: 20, 
      idleTimeoutMillis: 30000, 
      connectionTimeoutMillis: 2000, 
      ...poolConfig
    };

    this.pool = new Pool(defaultPoolConfig);

    this.pool.on("error", (err) => {
      log.error("PostgresDriver", "Error inesperado del pool de PostgreSQL:", err);
    });

    log.info("PostgresDriver", "Pool de PostgreSQL inicializado");
  }

  prepare(sql) {
    return new PostgresPreparedStatement(this.pool, sql);
  }

  async exec(sql) {
    try {
      await this.pool.query(sql);
    } catch (error) {
      throw new DatabaseQueryError(error.message, sql);
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    log.info("PostgresDriver", "Pool de PostgreSQL cerrado");
  }

  async healthCheck() {
    try {
      const result = await this.pool.query("SELECT 1 as health");
      return result.rows[0]?.health === 1;
    } catch (error) {
      log.error("PostgresDriver", "Health check falló:", error.message);
      return false;
    }
  }

  getPool() {
    return this.pool;
  }
}

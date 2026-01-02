/**
 * Adaptador para PostgreSQL usando pg (node-postgres)
 * Implementa la interfaz DatabaseDriver para compatibilidad con SQLite
 */

import pg from "pg";
const { Pool, Client } = pg;
import { DatabaseDriver, PreparedStatement } from "./interface.js";
import { DatabaseQueryError, DatabaseConnectionError } from "../errors/database.error.js";
import { log } from "../logger/index.js";

/**
 * Wrapper para prepared statements de PostgreSQL
 * PostgreSQL no tiene "prepared statements" persistentes como SQLite,
 * así que almacenamos el SQL y lo ejecutamos con parámetros
 */
class PostgresPreparedStatement extends PreparedStatement {
  constructor(pool, sql) {
    super();
    this.pool = pool;
    this.sql = sql;
  }

  /**
   * Convierte parámetros posicionales (?) de SQLite a parámetros nombrados ($1, $2, etc) de PostgreSQL
   * @param {string} sql - SQL con placeholders ?
   * @param {Array} params - Parámetros
   * @returns {Object} { sql: converted SQL, values: array of values }
   */
  convertParams(sql, params) {
    let paramIndex = 1;
    const values = [];
    const convertedSql = sql.replace(/\?/g, () => {
      values.push(params[paramIndex - 1]);
      return `$${paramIndex++}`;
    });
    return { sql: convertedSql, values };
  }

  /**
   * Convierte parámetros nombrados (@param) de SQLite a parámetros posicionales ($1, $2, etc) de PostgreSQL
   * @param {string} sql - SQL con placeholders @param
   * @param {Object} params - Objeto con parámetros
   * @returns {Object} { sql: converted SQL, values: array of values }
   */
  convertNamedParams(sql, paramsObj) {
    const values = [];
    const paramMap = new Map();
    let paramIndex = 1;

    // Extraer nombres de parámetros del SQL (@guild_id, @welcome_channel_id, etc)
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

      // Detectar si usa parámetros nombrados (@param) o posicionales (?)
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
      
      // Simular el formato de SQLite: { lastInsertRowid, changes }
      // PostgreSQL retorna rows, rowCount
      return {
        lastInsertRowid: result.rows[0]?.id || null, // Asume que hay un campo 'id' si es INSERT
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

/**
 * Driver PostgreSQL que implementa DatabaseDriver
 */
export class PostgresDriver extends DatabaseDriver {
  /**
   * @param {string} connectionString - Connection string de PostgreSQL (ej: postgresql://user:pass@host:port/db)
   * @param {Object} poolConfig - Configuración opcional del pool
   */
  constructor(connectionString, poolConfig = {}) {
    super();
    
    if (!connectionString) {
      throw new DatabaseConnectionError("Connection string de PostgreSQL es requerida");
    }

    const defaultPoolConfig = {
      connectionString,
      max: 20, // máximo de conexiones en el pool
      idleTimeoutMillis: 30000, // cerrar conexiones idle después de 30s
      connectionTimeoutMillis: 2000, // timeout al obtener conexión del pool
      ...poolConfig
    };

    this.pool = new Pool(defaultPoolConfig);
    
    // Manejar errores del pool
    this.pool.on("error", (err) => {
      log.error("PostgresDriver", "Error inesperado del pool de PostgreSQL:", err);
    });

    log.info("PostgresDriver", "Pool de PostgreSQL inicializado");
  }

  /**
   * Prepara una statement (PostgreSQL no tiene prepared statements persistentes,
   * pero mantenemos la interfaz para compatibilidad)
   * @param {string} sql - Query SQL
   * @returns {PostgresPreparedStatement}
   */
  prepare(sql) {
    return new PostgresPreparedStatement(this.pool, sql);
  }

  /**
   * Ejecuta una query SQL directamente (sin preparar)
   * @param {string} sql - Query SQL a ejecutar
   * @returns {Promise<void>}
   */
  async exec(sql) {
    try {
      await this.pool.query(sql);
    } catch (error) {
      throw new DatabaseQueryError(error.message, sql);
    }
  }

  /**
   * Ejecuta un callback dentro de una transacción
   * @param {Function} callback - Función a ejecutar en la transacción
   * @returns {Promise<*>}
   */
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

  /**
   * Cierra el pool de conexiones
   * @returns {Promise<void>}
   */
  async close() {
    await this.pool.end();
    log.info("PostgresDriver", "Pool de PostgreSQL cerrado");
  }

  /**
   * Verifica la conexión a la base de datos
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const result = await this.pool.query("SELECT 1 as health");
      return result.rows[0]?.health === 1;
    } catch (error) {
      log.error("PostgresDriver", "Health check falló:", error.message);
      return false;
    }
  }

  /**
   * Obtiene el pool nativo (para uso avanzado)
   * @returns {Pool}
   */
  getPool() {
    return this.pool;
  }
}

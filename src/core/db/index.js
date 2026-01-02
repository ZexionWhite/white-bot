/**
 * Módulo central de base de datos
 * Proporciona una interfaz unificada para acceso a la base de datos
 * Soporta SQLite (default) y PostgreSQL (vía DATABASE_URL)
 */

import fs from "node:fs";
import path from "node:path";
import { SQLiteDriver } from "./sqlite-adapter.js";
import { PostgresDriver } from "./postgres-adapter.js";
import { getEnv } from "../config/index.js";
import { log } from "../logger/index.js";
import { DatabaseConnectionError } from "../errors/database.error.js";

// Driver actual (SQLite o PostgreSQL)
let driver = null;

/**
 * Inicializa el driver según configuración
 * @returns {DatabaseDriver}
 */
function getDriverInstance() {
  if (driver) {
    return driver;
  }

  const dbProvider = getEnv("DB_PROVIDER") || "sqlite";
  const databaseUrl = getEnv("DATABASE_URL");

  if (dbProvider === "postgres" || databaseUrl) {
    if (!databaseUrl) {
      throw new DatabaseConnectionError(
        "DATABASE_URL es requerida cuando DB_PROVIDER=postgres"
      );
    }

    log.info("DB", "Inicializando driver PostgreSQL...");
    driver = new PostgresDriver(databaseUrl);
    
    // Health check al inicializar
    driver.healthCheck().then((healthy) => {
      if (healthy) {
        log.info("DB", "Conexión a PostgreSQL verificada exitosamente");
      } else {
        log.error("DB", "Health check de PostgreSQL falló");
      }
    }).catch((err) => {
      log.error("DB", "Error en health check de PostgreSQL:", err.message);
    });
  } else {
    // SQLite por defecto
    const dbPath = path.join(process.cwd(), "data", "bot.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    log.info("DB", "Inicializando driver SQLite...");
    driver = new SQLiteDriver(dbPath);
    log.debug("DB", "Driver SQLite inicializado");
  }

  return driver;
}

// Exponer el driver para uso avanzado si es necesario
export { getDriverInstance as getDriver };
export { SQLiteDriver } from "./sqlite-adapter.js";
export { PostgresDriver } from "./postgres-adapter.js";
export { DatabaseDriver, PreparedStatement } from "./interface.js";

/**
 * Helper para preparar statements (compatibilidad con código existente)
 * @param {string} sql - Query SQL
 * @returns {PreparedStatement}
 */
export function prepare(sql) {
  return getDriverInstance().prepare(sql);
}

/**
 * Helper para ejecutar queries directamente (compatibilidad con código existente)
 * @param {string} sql - Query SQL
 * @returns {Promise<void>|void}
 */
export function exec(sql) {
  const instance = getDriverInstance();
  if (instance instanceof PostgresDriver) {
    // PostgreSQL es async
    return instance.exec(sql);
  } else {
    // SQLite es sync
    return instance.exec(sql);
  }
}

/**
 * Helper para obtener información de tabla
 * SQLite: PRAGMA table_info
 * PostgreSQL: información_schema.columns
 * @param {string} table - Nombre de la tabla
 * @returns {Promise<Array>|Array} Información de las columnas
 */
export async function pragmaTableInfo(table) {
  const instance = getDriverInstance();
  
  if (instance instanceof PostgresDriver) {
    // PostgreSQL: usar information_schema
    const pool = instance.getPool();
    const result = await pool.query(`
      SELECT column_name as name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    return result.rows;
  } else {
    // SQLite: usar PRAGMA (síncrono)
    return instance.pragmaTableInfo(table);
  }
}

/**
 * Obtiene la instancia nativa (SQLite Database o PostgreSQL Pool)
 * @returns {Database|Pool}
 */
export function getNative() {
  const instance = getDriverInstance();
  if (instance instanceof PostgresDriver) {
    return instance.getPool();
  } else {
    return instance.native;
  }
}

/**
 * Obtiene el tipo de driver actual
 * @returns {"sqlite"|"postgres"}
 */
export function getDriverType() {
  const instance = getDriverInstance();
  return instance instanceof PostgresDriver ? "postgres" : "sqlite";
}

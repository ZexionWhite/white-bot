import fs from "node:fs";
import path from "node:path";
import { SQLiteDriver } from "./sqlite-adapter.js";
import { PostgresDriver } from "./postgres-adapter.js";
import { getEnv } from "../config/index.js";
import { log } from "../logger/index.js";
import { DatabaseConnectionError } from "../errors/database.error.js";

let driver = null;

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
    
    const dbPath = path.join(process.cwd(), "data", "bot.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    log.info("DB", "Inicializando driver SQLite...");
    driver = new SQLiteDriver(dbPath);
    log.debug("DB", "Driver SQLite inicializado");
  }

  return driver;
}

export { getDriverInstance as getDriver };
export { SQLiteDriver } from "./sqlite-adapter.js";
export { PostgresDriver } from "./postgres-adapter.js";
export { DatabaseDriver, PreparedStatement } from "./interface.js";

export function prepare(sql) {
  return getDriverInstance().prepare(sql);
}

export function exec(sql) {
  const instance = getDriverInstance();
  if (instance instanceof PostgresDriver) {
    
    return instance.exec(sql);
  } else {
    
    return instance.exec(sql);
  }
}

export function pragmaTableInfo(table) {
  const instance = getDriverInstance();
  
  if (instance instanceof PostgresDriver) {
    
    throw new Error("pragmaTableInfo es async en PostgreSQL. No usar al nivel de módulo.");
  } else {
    
    return instance.pragmaTableInfo(table);
  }
}

export async function pragmaTableInfoAsync(table) {
  const instance = getDriverInstance();
  
  if (instance instanceof PostgresDriver) {
    
    const pool = instance.getPool();
    const result = await pool.query(`
      SELECT column_name as name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    return result.rows;
  } else {
    
    return Promise.resolve(instance.pragmaTableInfo(table));
  }
}

export function getNative() {
  const instance = getDriverInstance();
  if (instance instanceof PostgresDriver) {
    return instance.getPool();
  } else {
    return instance.native;
  }
}

export function getDriverType() {
  const instance = getDriverInstance();
  return instance instanceof PostgresDriver ? "postgres" : "sqlite";
}

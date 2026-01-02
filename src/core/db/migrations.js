/**
 * Sistema de migraciones para PostgreSQL
 * Maneja la creación de columnas adicionales y cambios de esquema
 */

import { getDriverType, getDriver, pragmaTableInfoAsync } from "./index.js";
import { log } from "../logger/index.js";

/**
 * Obtiene información de columnas de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @returns {Promise<Array>} Array con nombres de columnas
 */
async function getTableColumns(tableName) {
  const cols = await pragmaTableInfoAsync(tableName);
  return cols.map(c => c.name);
}

/**
 * Añade una columna a una tabla si no existe
 * Compatible con SQLite y PostgreSQL
 * @param {string} tableName - Nombre de la tabla
 * @param {string} columnName - Nombre de la columna
 * @param {string} columnDDL - Definición de la columna (ej: "TEXT", "INTEGER DEFAULT 60")
 * @returns {Promise<void>|void}
 */
export async function ensureColumn(tableName, columnName, columnDDL) {
  const driverType = getDriverType();
  const driver = getDriver();
  const columns = await getTableColumns(tableName);

  if (columns.includes(columnName)) {
    return; // Columna ya existe
  }

  // Convertir DDL de SQLite a PostgreSQL si es necesario
  let ddl = columnDDL;
  if (driverType === "postgres") {
    // Convertir tipos comunes
    ddl = ddl.replace(/INTEGER/g, "BIGINT");
    // Mantener DEFAULT, NOT NULL, etc.
  }

  const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${ddl}`;

  if (driverType === "postgres") {
    await driver.exec(sql);
  } else {
    driver.exec(sql);
  }

  log.debug("DB", `Columna agregada: ${tableName}.${columnName}`);
}

/**
 * Ejecuta todas las migraciones de columnas necesarias
 * Esto reemplaza las llamadas a ensureColumn en db.js
 */
export async function runColumnMigrations() {
  const migrations = [
    { table: "guild_settings", column: "welcome_cd_minutes", ddl: "INTEGER DEFAULT 60" },
    { table: "guild_settings", column: "booster_announce_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "info_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "message_log_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "avatar_log_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "nickname_log_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "voice_log_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "modlog_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "blacklist_channel_id", ddl: "TEXT" },
    { table: "guild_settings", column: "mute_role_id", ddl: "TEXT" },
    { table: "guild_settings", column: "dm_on_punish", ddl: "INTEGER DEFAULT 1" },
    { table: "guild_settings", column: "command_prefix", ddl: "TEXT DEFAULT 'capy!'" }
  ];

  for (const migration of migrations) {
    await ensureColumn(migration.table, migration.column, migration.ddl);
  }
}

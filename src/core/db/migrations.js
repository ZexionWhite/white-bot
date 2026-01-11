import { getDriverType, getDriver, pragmaTableInfoAsync } from "./index.js";
import { log } from "../logger/index.js";

async function getTableColumns(tableName) {
  const cols = await pragmaTableInfoAsync(tableName);
  return cols.map(c => c.name);
}

export async function ensureColumn(tableName, columnName, columnDDL) {
  const driverType = getDriverType();
  const driver = getDriver();
  const columns = await getTableColumns(tableName);

  if (columns.includes(columnName)) {
    return; 
  }

  let ddl = columnDDL;
  if (driverType === "postgres") {
    ddl = ddl.replace(/INTEGER/g, "BIGINT");
  }

  const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${ddl}`;

  if (driverType === "postgres") {
    await driver.exec(sql);
  } else {
    driver.exec(sql);
  }

  log.debug("DB", `Columna agregada: ${tableName}.${columnName}`);
}

async function tableExists(tableName) {
  const driverType = getDriverType();
  const driver = getDriver();
  
  if (driverType === "postgres") {
    const pool = driver.getPool();
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  } else {
    
    try {
      const result = driver.native.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(tableName);
      return !!result;
    } catch {
      return false;
    }
  }
}

export async function createBaseTables() {
  const driverType = getDriverType();
  
  if (driverType !== "postgres") {
    return; 
  }
  
  const driver = getDriver();
  const pool = driver.getPool();
  
  log.info("DB", "Verificando y creando tablas base para PostgreSQL...");

  if (!(await tableExists("guild_settings"))) {
    await pool.query(`
      CREATE TABLE guild_settings (
        guild_id VARCHAR(255) PRIMARY KEY,
        welcome_channel_id VARCHAR(255),
        log_channel_id VARCHAR(255),
        autorole_channel_id VARCHAR(255),
        autorole_message_id VARCHAR(255),
        booster_role_id VARCHAR(255)
      )
    `);
    log.info("DB", "Tabla guild_settings creada");
  }

  if (!(await tableExists("color_roles"))) {
    await pool.query(`
      CREATE TABLE color_roles (
        guild_id VARCHAR(255),
        role_id VARCHAR(255),
        name VARCHAR(255),
        hex VARCHAR(255),
        booster_only BIGINT DEFAULT 0,
        PRIMARY KEY (guild_id, role_id)
      )
    `);
    log.info("DB", "Tabla color_roles creada");
  }

  if (!(await tableExists("cooldowns"))) {
    await pool.query(`
      CREATE TABLE cooldowns (
        guild_id VARCHAR(255),
        user_id VARCHAR(255),
        event VARCHAR(255),
        last_ts BIGINT,
        PRIMARY KEY (guild_id, user_id, event)
      )
    `);
    log.info("DB", "Tabla cooldowns creada");
  }

  if (!(await tableExists("voice_sessions"))) {
    await pool.query(`
      CREATE TABLE voice_sessions (
        guild_id VARCHAR(255),
        user_id VARCHAR(255),
        channel_id VARCHAR(255),
        join_timestamp BIGINT,
        PRIMARY KEY (guild_id, user_id)
      )
    `);
    log.info("DB", "Tabla voice_sessions creada");
  }

  if (!(await tableExists("user_stats"))) {
    await pool.query(`
      CREATE TABLE user_stats (
        guild_id VARCHAR(255),
        user_id VARCHAR(255),
        total_voice_seconds BIGINT DEFAULT 0,
        message_count BIGINT DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);
    log.info("DB", "Tabla user_stats creada");
  }

  if (!(await tableExists("mod_cases"))) {
    await pool.query(`
      CREATE TABLE mod_cases (
        id BIGSERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        moderator_id VARCHAR(255) NOT NULL,
        reason TEXT,
        created_at BIGINT NOT NULL,
        expires_at BIGINT,
        active BIGINT DEFAULT 1,
        deleted_at BIGINT,
        deleted_by VARCHAR(255),
        deleted_reason TEXT,
        metadata TEXT
      )
    `);
    log.info("DB", "Tabla mod_cases creada");
  }

  if (!(await tableExists("mod_policy"))) {
    await pool.query(`
      CREATE TABLE mod_policy (
        guild_id VARCHAR(255) NOT NULL,
        command_key VARCHAR(255) NOT NULL,
        subject_type VARCHAR(255) NOT NULL,
        subject_id VARCHAR(255) NOT NULL,
        effect VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        PRIMARY KEY (guild_id, command_key, subject_type, subject_id)
      )
    `);
    log.info("DB", "Tabla mod_policy creada");
  }

  if (!(await tableExists("voice_activity"))) {
    await pool.query(`
      CREATE TABLE voice_activity (
        id BIGSERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        channel_id VARCHAR(255),
        at BIGINT NOT NULL
      )
    `);
    log.info("DB", "Tabla voice_activity creada");
  }

  if (!(await tableExists("message_log"))) {
    await pool.query(`
      CREATE TABLE message_log (
        id BIGSERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        channel_id VARCHAR(255) NOT NULL,
        message_id VARCHAR(255) NOT NULL,
        content TEXT,
        at BIGINT NOT NULL
      )
    `);
    log.info("DB", "Tabla message_log creada");
  }

  if (!(await tableExists("blacklist"))) {
    await pool.query(`
      CREATE TABLE blacklist (
        id BIGSERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        moderator_id VARCHAR(255) NOT NULL,
        reason TEXT,
        evidence TEXT,
        severity VARCHAR(255),
        created_at BIGINT NOT NULL,
        updated_at BIGINT,
        updated_by VARCHAR(255),
        deleted_at BIGINT,
        deleted_by VARCHAR(255),
        deleted_reason TEXT
      )
    `);
    log.info("DB", "Tabla blacklist creada");
  }

  if (!(await tableExists("pending_actions"))) {
    await pool.query(`
      CREATE TABLE pending_actions (
        id BIGSERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        command VARCHAR(255) NOT NULL,
        payload_json TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
    log.info("DB", "Tabla pending_actions creada");
  }
  
  log.info("DB", "✅ Todas las tablas base verificadas/creadas");
}

export async function runColumnMigrations() {
  const migrations = [
    {
      table: "guild_settings",
      column: "locale",
      ddl: "TEXT DEFAULT NULL"
    },
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

  log.info("DB", "Ejecutando migraciones de columnas...");
  
  for (const migration of migrations) {
    try {
      await ensureColumn(migration.table, migration.column, migration.ddl);
    } catch (error) {
      log.error("DB", `Error en migración ${migration.table}.${migration.column}: ${error.message}`);
      
    }
  }
  
  log.info("DB", "✅ Migraciones de columnas completadas");
}

export async function runAllMigrations() {
  try {
    await createBaseTables();
    await runColumnMigrations();
    log.info("DB", "✅ Todas las migraciones ejecutadas exitosamente");
  } catch (error) {
    log.error("DB", `Error ejecutando migraciones: ${error.message}`);
    throw error;
  }
}

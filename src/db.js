/**
 * Módulo de base de datos legacy (compatibilidad)
 * Internamente usa src/core/db/ para abstracción
 * TODO: En FASE 2, este archivo será refactorizado o eliminado
 */
import { getNative, prepare, exec, pragmaTableInfo, getDriverType } from "./core/db/index.js";
import { log } from "./core/logger/index.js";

// Obtener instancia nativa de SQLite para compatibilidad
const db = getNative();

// Ejecutar CREATE TABLE solo si es SQLite (PostgreSQL usa migraciones)
const driverType = getDriverType();
if (driverType === "sqlite") {
  exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    welcome_channel_id TEXT,
    log_channel_id TEXT,
    autorole_channel_id TEXT,
    autorole_message_id TEXT,
    booster_role_id TEXT
  );

  CREATE TABLE IF NOT EXISTS color_roles (
    guild_id TEXT,
    role_id TEXT,
    name TEXT,
    hex TEXT,
    booster_only INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, role_id)
  );

  CREATE TABLE IF NOT EXISTS cooldowns (
    guild_id TEXT,
    user_id  TEXT,
    event    TEXT,
    last_ts  INTEGER,
    PRIMARY KEY (guild_id, user_id, event)
  );

  CREATE TABLE IF NOT EXISTS voice_sessions (
    guild_id TEXT,
    user_id  TEXT,
    channel_id TEXT,
    join_timestamp INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS user_stats (
    guild_id TEXT,
    user_id  TEXT,
    total_voice_seconds INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS mod_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    active INTEGER DEFAULT 1,
    deleted_at INTEGER,
    deleted_by TEXT,
    deleted_reason TEXT,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS mod_policy (
    guild_id TEXT NOT NULL,
    command_key TEXT NOT NULL,
    subject_type TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    effect TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    PRIMARY KEY (guild_id, command_key, subject_type, subject_id)
  );

  CREATE TABLE IF NOT EXISTS voice_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    channel_id TEXT,
    at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS message_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    content TEXT,
    at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    evidence TEXT,
    severity TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    updated_by TEXT,
    deleted_at INTEGER,
    deleted_by TEXT,
    deleted_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS pending_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    command TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);
}

// ensureColumn solo funciona en SQLite (PostgreSQL usa migraciones)
// SQLite tiene pragmaTableInfo síncrono, PostgreSQL lo tiene async
function ensureColumn(table, column, ddl) {
  if (driverType !== "sqlite") {
    return; // PostgreSQL usa migraciones, no ensureColumn
  }
  
  // En SQLite, pragmaTableInfo es síncrono
  const cols = pragmaTableInfo(table).map(c => c.name);
  if (!cols.includes(column)) {
    exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    log.debug("DB", `Columna agregada: ${table}.${column}`);
  }
}

// Solo ejecutar ensureColumn en SQLite (al nivel de módulo solo funciona para SQLite síncrono)
if (driverType === "sqlite") {
  ensureColumn("guild_settings", "welcome_cd_minutes", "welcome_cd_minutes INTEGER DEFAULT 60");
  ensureColumn("guild_settings", "booster_announce_channel_id", "booster_announce_channel_id TEXT");
  ensureColumn("guild_settings", "info_channel_id", "info_channel_id TEXT");
  ensureColumn("guild_settings", "message_log_channel_id", "message_log_channel_id TEXT");
  ensureColumn("guild_settings", "avatar_log_channel_id", "avatar_log_channel_id TEXT");
  ensureColumn("guild_settings", "nickname_log_channel_id", "nickname_log_channel_id TEXT");
  ensureColumn("guild_settings", "voice_log_channel_id", "voice_log_channel_id TEXT");
  ensureColumn("guild_settings", "modlog_channel_id", "modlog_channel_id TEXT");
  ensureColumn("guild_settings", "blacklist_channel_id", "blacklist_channel_id TEXT");
  ensureColumn("guild_settings", "mute_role_id", "mute_role_id TEXT");
  ensureColumn("guild_settings", "dm_on_punish", "dm_on_punish INTEGER DEFAULT 1");
  ensureColumn("guild_settings", "command_prefix", "command_prefix TEXT DEFAULT 'capy!'");
}

export const getSettings = prepare(`
  SELECT *
  FROM guild_settings
  WHERE guild_id = ?;
`);

export const upsertSettings = prepare(`
  INSERT INTO guild_settings (
    guild_id,
    welcome_channel_id,
    log_channel_id,
    autorole_channel_id,
    autorole_message_id,
    booster_role_id,
    booster_announce_channel_id,
    welcome_cd_minutes,
    info_channel_id,
    message_log_channel_id,
    avatar_log_channel_id,
    nickname_log_channel_id,
    voice_log_channel_id,
    modlog_channel_id,
    blacklist_channel_id,
    mute_role_id,
    dm_on_punish,
    command_prefix
  )
  VALUES (
    @guild_id,
    @welcome_channel_id,
    @log_channel_id,
    @autorole_channel_id,
    @autorole_message_id,
    @booster_role_id,
    @booster_announce_channel_id,
    @welcome_cd_minutes,
    @info_channel_id,
    @message_log_channel_id,
    @avatar_log_channel_id,
    @nickname_log_channel_id,
    @voice_log_channel_id,
    @modlog_channel_id,
    @blacklist_channel_id,
    @mute_role_id,
    @dm_on_punish,
    @command_prefix
  )
  ON CONFLICT(guild_id) DO UPDATE SET
    welcome_channel_id           = excluded.welcome_channel_id,
    log_channel_id               = excluded.log_channel_id,
    autorole_channel_id          = excluded.autorole_channel_id,
    autorole_message_id          = excluded.autorole_message_id,
    booster_role_id              = excluded.booster_role_id,
    booster_announce_channel_id  = excluded.booster_announce_channel_id,
    welcome_cd_minutes           = excluded.welcome_cd_minutes,
    info_channel_id              = excluded.info_channel_id,
    message_log_channel_id       = excluded.message_log_channel_id,
    avatar_log_channel_id        = excluded.avatar_log_channel_id,
    nickname_log_channel_id      = excluded.nickname_log_channel_id,
    voice_log_channel_id         = excluded.voice_log_channel_id,
    modlog_channel_id            = excluded.modlog_channel_id,
    blacklist_channel_id         = excluded.blacklist_channel_id,
    mute_role_id                 = excluded.mute_role_id,
    dm_on_punish                 = excluded.dm_on_punish,
    command_prefix               = excluded.command_prefix;
`);

export const insertColorRole = prepare(`
  INSERT INTO color_roles (guild_id, role_id, name, hex, booster_only)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(guild_id, role_id) DO UPDATE SET
    name = EXCLUDED.name,
    hex = EXCLUDED.hex,
    booster_only = EXCLUDED.booster_only;
`);

export const getColorRoles = prepare(`
  SELECT * FROM color_roles
  WHERE guild_id = ?
  ORDER BY name;
`);

export const getCooldown = prepare(`
  SELECT last_ts
  FROM cooldowns
  WHERE guild_id = ? AND user_id = ? AND event = ?;
`);

export const setCooldown = prepare(`
  INSERT INTO cooldowns (guild_id, user_id, event, last_ts)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(guild_id, user_id, event) DO UPDATE SET
    last_ts = excluded.last_ts;
`);

export const startVoiceSession = prepare(`
  INSERT INTO voice_sessions (guild_id, user_id, channel_id, join_timestamp)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    channel_id = EXCLUDED.channel_id,
    join_timestamp = EXCLUDED.join_timestamp;
`);

export const endVoiceSession = prepare(`
  DELETE FROM voice_sessions
  WHERE guild_id = ? AND user_id = ?;
`);

export const getVoiceSession = prepare(`
  SELECT * FROM voice_sessions
  WHERE guild_id = ? AND user_id = ?;
`);

export const getUserStats = prepare(`
  SELECT * FROM user_stats
  WHERE guild_id = ? AND user_id = ?;
`);

export const incrementVoiceTime = prepare(`
  INSERT INTO user_stats (guild_id, user_id, total_voice_seconds, message_count)
  VALUES (?, ?, ?, 0)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    total_voice_seconds = user_stats.total_voice_seconds + EXCLUDED.total_voice_seconds;
`);

export const incrementMessageCount = prepare(`
  INSERT INTO user_stats (guild_id, user_id, total_voice_seconds, message_count)
  VALUES (?, ?, 0, 1)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    message_count = user_stats.message_count + 1;
`);

export default db;

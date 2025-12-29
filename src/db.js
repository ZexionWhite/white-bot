import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "bot.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// ---------- esquema base ----------
db.exec(`
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

  -- cooldowns por evento (e.g. 'welcome')
  CREATE TABLE IF NOT EXISTS cooldowns (
    guild_id TEXT,
    user_id  TEXT,
    event    TEXT,
    last_ts  INTEGER,
    PRIMARY KEY (guild_id, user_id, event)
  );

  -- sesiones de voz activas (para calcular tiempo)
  CREATE TABLE IF NOT EXISTS voice_sessions (
    guild_id TEXT,
    user_id  TEXT,
    channel_id TEXT,
    join_timestamp INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );

  -- estadísticas de usuario por servidor
  CREATE TABLE IF NOT EXISTS user_stats (
    guild_id TEXT,
    user_id  TEXT,
    total_voice_seconds INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
`);

// ---------- migraciones idempotentes ----------
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info('${table}')`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

// nuevas columnas para features
ensureColumn("guild_settings", "welcome_cd_minutes", "welcome_cd_minutes INTEGER DEFAULT 60");
ensureColumn("guild_settings", "booster_announce_channel_id", "booster_announce_channel_id TEXT");
ensureColumn("guild_settings", "info_channel_id", "info_channel_id TEXT");
ensureColumn("guild_settings", "message_log_channel_id", "message_log_channel_id TEXT");
ensureColumn("guild_settings", "avatar_log_channel_id", "avatar_log_channel_id TEXT");
ensureColumn("guild_settings", "nickname_log_channel_id", "nickname_log_channel_id TEXT");
ensureColumn("guild_settings", "voice_log_channel_id", "voice_log_channel_id TEXT");

// ---------- prepared statements ----------
export const getSettings = db.prepare(`
  SELECT *
  FROM guild_settings
  WHERE guild_id = ?;
`);

export const upsertSettings = db.prepare(`
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
    voice_log_channel_id
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
    @voice_log_channel_id
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
    voice_log_channel_id         = excluded.voice_log_channel_id;
`);

export const insertColorRole = db.prepare(`
  INSERT OR REPLACE INTO color_roles (guild_id, role_id, name, hex, booster_only)
  VALUES (?, ?, ?, ?, ?);
`);

export const getColorRoles = db.prepare(`
  SELECT * FROM color_roles
  WHERE guild_id = ?
  ORDER BY name;
`);

// cooldowns
export const getCooldown = db.prepare(`
  SELECT last_ts
  FROM cooldowns
  WHERE guild_id = ? AND user_id = ? AND event = ?;
`);

export const setCooldown = db.prepare(`
  INSERT INTO cooldowns (guild_id, user_id, event, last_ts)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(guild_id, user_id, event) DO UPDATE SET
    last_ts = excluded.last_ts;
`);

// voice sessions
export const startVoiceSession = db.prepare(`
  INSERT OR REPLACE INTO voice_sessions (guild_id, user_id, channel_id, join_timestamp)
  VALUES (?, ?, ?, ?);
`);

export const endVoiceSession = db.prepare(`
  DELETE FROM voice_sessions
  WHERE guild_id = ? AND user_id = ?;
`);

export const getVoiceSession = db.prepare(`
  SELECT * FROM voice_sessions
  WHERE guild_id = ? AND user_id = ?;
`);

// user stats
export const getUserStats = db.prepare(`
  SELECT * FROM user_stats
  WHERE guild_id = ? AND user_id = ?;
`);

export const incrementVoiceTime = db.prepare(`
  INSERT INTO user_stats (guild_id, user_id, total_voice_seconds, message_count)
  VALUES (?, ?, ?, 0)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    total_voice_seconds = total_voice_seconds + excluded.total_voice_seconds;
`);

export const incrementMessageCount = db.prepare(`
  INSERT INTO user_stats (guild_id, user_id, total_voice_seconds, message_count)
  VALUES (?, ?, 0, 1)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    message_count = message_count + 1;
`);

export default db;

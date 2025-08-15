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
ensureColumn("guild_settings", "nickname_log_channel_id", "nickname_log_channel_id TEXT"); // 🆕

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
    nickname_log_channel_id
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
    @nickname_log_channel_id
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
    nickname_log_channel_id      = excluded.nickname_log_channel_id;
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

export default db;

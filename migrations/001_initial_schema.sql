-- Migración inicial: Esquema completo de SQLite a PostgreSQL
-- Ejecutar este script en PostgreSQL para crear todas las tablas

-- Tabla de configuración de servidores
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  welcome_channel_id TEXT,
  log_channel_id TEXT,
  autorole_channel_id TEXT,
  autorole_message_id TEXT,
  booster_role_id TEXT,
  booster_announce_channel_id TEXT,
  welcome_cd_minutes INTEGER DEFAULT 60,
  info_channel_id TEXT,
  message_log_channel_id TEXT,
  avatar_log_channel_id TEXT,
  nickname_log_channel_id TEXT,
  voice_log_channel_id TEXT,
  modlog_channel_id TEXT,
  blacklist_channel_id TEXT,
  mute_role_id TEXT,
  dm_on_punish INTEGER DEFAULT 1,
  command_prefix TEXT DEFAULT 'capy!'
);

-- Tabla de roles de colores
CREATE TABLE IF NOT EXISTS color_roles (
  guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  name TEXT,
  hex TEXT,
  booster_only INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, role_id)
);

-- Tabla de cooldowns
CREATE TABLE IF NOT EXISTS cooldowns (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event TEXT NOT NULL,
  last_ts BIGINT NOT NULL,
  PRIMARY KEY (guild_id, user_id, event)
);

-- Tabla de sesiones de voz
CREATE TABLE IF NOT EXISTS voice_sessions (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  channel_id TEXT,
  join_timestamp BIGINT NOT NULL,
  PRIMARY KEY (guild_id, user_id)
);

-- Tabla de estadísticas de usuarios
CREATE TABLE IF NOT EXISTS user_stats (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  total_voice_seconds BIGINT DEFAULT 0,
  message_count BIGINT DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

-- Tabla de casos de moderación
CREATE TABLE IF NOT EXISTS mod_cases (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT,
  created_at BIGINT NOT NULL,
  expires_at BIGINT,
  active INTEGER DEFAULT 1,
  deleted_at BIGINT,
  deleted_by TEXT,
  deleted_reason TEXT,
  metadata TEXT
);

-- Índices para mod_cases
CREATE INDEX IF NOT EXISTS idx_mod_cases_guild_target ON mod_cases(guild_id, target_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_guild_type ON mod_cases(guild_id, type);
CREATE INDEX IF NOT EXISTS idx_mod_cases_expires_at ON mod_cases(expires_at) WHERE expires_at IS NOT NULL;

-- Tabla de políticas de permisos
CREATE TABLE IF NOT EXISTS mod_policy (
  guild_id TEXT NOT NULL,
  command_key TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  effect TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  created_by TEXT NOT NULL,
  PRIMARY KEY (guild_id, command_key, subject_type, subject_id)
);

-- Tabla de actividad de voz
CREATE TABLE IF NOT EXISTS voice_activity (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  channel_id TEXT,
  at BIGINT NOT NULL
);

-- Índices para voice_activity
CREATE INDEX IF NOT EXISTS idx_voice_activity_guild_user ON voice_activity(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_voice_activity_at ON voice_activity(at);

-- Tabla de log de mensajes
CREATE TABLE IF NOT EXISTS message_log (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  content TEXT,
  at BIGINT NOT NULL
);

-- Índices para message_log
CREATE INDEX IF NOT EXISTS idx_message_log_guild_user ON message_log(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_log_at ON message_log(at);

-- Tabla de blacklist
CREATE TABLE IF NOT EXISTS blacklist (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT,
  evidence TEXT,
  severity TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT,
  updated_by TEXT,
  deleted_at BIGINT,
  deleted_by TEXT,
  deleted_reason TEXT
);

-- Índices para blacklist
CREATE INDEX IF NOT EXISTS idx_blacklist_guild_user ON blacklist(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_created_at ON blacklist(created_at);

-- Tabla de acciones pendientes
CREATE TABLE IF NOT EXISTS pending_actions (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  command TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Índice para pending_actions
CREATE INDEX IF NOT EXISTS idx_pending_actions_created_at ON pending_actions(created_at);

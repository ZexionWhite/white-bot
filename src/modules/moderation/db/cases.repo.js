import { prepare } from "../../../core/db/index.js";

export const createCase = prepare(`
  INSERT INTO mod_cases (guild_id, type, target_id, moderator_id, reason, created_at, expires_at, active, metadata)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING id
`);

export const getCaseById = prepare(`
  SELECT * FROM mod_cases WHERE id = ? AND guild_id = ?
`);

export const getCasesByUser = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND target_id = ? AND deleted_at IS NULL AND type != 'BLACKLIST'
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`);

export const getCasesByType = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND target_id = ? AND type = ? AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`);

export const getActiveCases = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND target_id = ? AND active = 1 AND deleted_at IS NULL
`);

export const getActiveTempbans = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND type = 'TEMPBAN' AND active = 1 AND deleted_at IS NULL
    AND expires_at IS NOT NULL AND expires_at <= ?
`);

export const getActiveMutes = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND type = 'MUTE' AND active = 1 AND deleted_at IS NULL
    AND expires_at IS NOT NULL AND expires_at <= ?
`);

export const getActiveTimeouts = prepare(`
  SELECT * FROM mod_cases 
  WHERE guild_id = ? AND type = 'TIMEOUT' AND active = 1 AND deleted_at IS NULL
    AND expires_at IS NOT NULL AND expires_at <= ?
`);

export const updateCase = prepare(`
  UPDATE mod_cases 
  SET reason = ?, metadata = ?
  WHERE id = ? AND guild_id = ?
`);

export const deleteCase = prepare(`
  UPDATE mod_cases 
  SET deleted_at = ?, deleted_by = ?, deleted_reason = ?, active = 0
  WHERE id = ? AND guild_id = ?
`);

export const deactivateCase = prepare(`
  UPDATE mod_cases 
  SET active = 0
  WHERE id = ? AND guild_id = ?
`);

export const countCasesByUser = prepare(`
  SELECT COUNT(*) as count FROM mod_cases 
  WHERE guild_id = ? AND target_id = ? AND deleted_at IS NULL AND type != 'BLACKLIST'
`);

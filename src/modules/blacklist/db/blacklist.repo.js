import { prepare } from "../../../core/db/index.js";

export const createBlacklistEntry = prepare(`
  INSERT INTO blacklist (guild_id, user_id, moderator_id, reason, evidence, severity, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

export const getBlacklistEntry = prepare(`
  SELECT * FROM blacklist WHERE id = ? AND guild_id = ?
`);

export const getBlacklistByUser = prepare(`
  SELECT * FROM blacklist 
  WHERE guild_id = ? AND user_id = ? AND deleted_at IS NULL
  ORDER BY created_at DESC
`);

export const updateBlacklistEntry = prepare(`
  UPDATE blacklist 
  SET reason = ?, evidence = ?, severity = ?, updated_at = ?, updated_by = ?
  WHERE id = ? AND guild_id = ?
`);

export const deleteBlacklistEntry = prepare(`
  UPDATE blacklist 
  SET deleted_at = ?, deleted_by = ?, deleted_reason = ?
  WHERE id = ? AND guild_id = ?
`);


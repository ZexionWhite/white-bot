import db from "../../../db.js";

export const createPolicy = db.prepare(`
  INSERT INTO mod_policy (guild_id, command_key, subject_type, subject_id, effect, created_at, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(guild_id, command_key, subject_type, subject_id) DO UPDATE SET
    effect = EXCLUDED.effect,
    created_at = EXCLUDED.created_at,
    created_by = EXCLUDED.created_by
`);

export const getPolicy = db.prepare(`
  SELECT * FROM mod_policy 
  WHERE guild_id = ? AND command_key = ? AND subject_type = ? AND subject_id = ?
`);

export const getPoliciesByCommand = db.prepare(`
  SELECT * FROM mod_policy 
  WHERE guild_id = ? AND command_key = ?
`);

export const getPoliciesBySubject = db.prepare(`
  SELECT * FROM mod_policy 
  WHERE guild_id = ? AND subject_type = ? AND subject_id = ?
`);

export const getAllPoliciesBySubject = db.prepare(`
  SELECT * FROM mod_policy 
  WHERE guild_id = ? AND subject_type = ? AND subject_id = ?
`);

export const deletePolicy = db.prepare(`
  DELETE FROM mod_policy 
  WHERE guild_id = ? AND command_key = ? AND subject_type = ? AND subject_id = ?
`);

export const deletePoliciesByCommand = db.prepare(`
  DELETE FROM mod_policy 
  WHERE guild_id = ? AND command_key = ?
`);

export const deleteAllPolicies = db.prepare(`
  DELETE FROM mod_policy 
  WHERE guild_id = ?
`);

import db from "../../../db.js";

export const insertVoiceActivity = db.prepare(`
  INSERT INTO voice_activity (guild_id, user_id, action, channel_id, at)
  VALUES (?, ?, ?, ?, ?)
`);

export const getVoiceActivity = db.prepare(`
  SELECT * FROM voice_activity 
  WHERE guild_id = ? AND user_id = ?
  ORDER BY at DESC
  LIMIT ?
`);

export const cleanupOldVoiceActivity = db.prepare(`
  DELETE FROM voice_activity 
  WHERE guild_id = ? AND user_id = ? AND id NOT IN (
    SELECT id FROM voice_activity 
    WHERE guild_id = ? AND user_id = ?
    ORDER BY at DESC
    LIMIT 5
  )
`);


import { prepare } from "../../../core/db/index.js";

export const insertVoiceActivity = prepare(`
  INSERT INTO voice_activity (guild_id, user_id, action, channel_id, at)
  VALUES (?, ?, ?, ?, ?)
`);

export const getVoiceActivity = prepare(`
  SELECT * FROM voice_activity 
  WHERE guild_id = ? AND user_id = ?
  ORDER BY at DESC
  LIMIT ?
`);

export const cleanupOldVoiceActivity = prepare(`
  DELETE FROM voice_activity 
  WHERE guild_id = ? AND user_id = ? AND id NOT IN (
    SELECT id FROM voice_activity 
    WHERE guild_id = ? AND user_id = ?
    ORDER BY at DESC
    LIMIT 5
  )
`);


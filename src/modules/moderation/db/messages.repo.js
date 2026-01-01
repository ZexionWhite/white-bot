import db from "../../../db.js";

export const insertMessage = db.prepare(`
  INSERT INTO message_log (guild_id, user_id, channel_id, message_id, content, at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export const getMessages = db.prepare(`
  SELECT * FROM message_log 
  WHERE guild_id = ? AND user_id = ?
  ORDER BY at DESC
  LIMIT ?
`);

export const cleanupOldMessages = db.prepare(`
  DELETE FROM message_log 
  WHERE guild_id = ? AND user_id = ? AND id NOT IN (
    SELECT id FROM message_log 
    WHERE guild_id = ? AND user_id = ?
    ORDER BY at DESC
    LIMIT 10
  )
`);


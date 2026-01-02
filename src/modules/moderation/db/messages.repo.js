import { prepare } from "../../../core/db/index.js";

export const insertMessage = prepare(`
  INSERT INTO message_log (guild_id, user_id, channel_id, message_id, content, at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export const getMessages = prepare(`
  SELECT * FROM message_log 
  WHERE guild_id = ? AND user_id = ?
  ORDER BY at DESC
  LIMIT ?
`);

export const cleanupOldMessages = prepare(`
  DELETE FROM message_log 
  WHERE guild_id = ? AND user_id = ? AND id NOT IN (
    SELECT id FROM message_log 
    WHERE guild_id = ? AND user_id = ?
    ORDER BY at DESC
    LIMIT 10
  )
`);


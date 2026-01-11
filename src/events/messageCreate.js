import { incrementMessageCount } from "../db.js";
import * as MessagesRepo from "../modules/moderation/db/messages.repo.js";
import { handlePrefixCommand } from "../core/commands/adapters/prefixAdapter.js";
import { log } from "../core/logger/index.js";

export default async function messageCreate(client, message) {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (message.system) return;

  const handled = await handlePrefixCommand(message);
  if (handled) {
    return; 
  }

  try {
    await incrementMessageCount.run(message.guild.id, message.author.id);
    
    const content = message.content ? (message.content.length > 200 ? message.content.substring(0, 200) : message.content) : null;
    await MessagesRepo.insertMessage.run(
      message.guild.id,
      message.author.id,
      message.channel.id,
      message.id,
      content,
      Date.now()
    );
    await MessagesRepo.cleanupOldMessages.run(message.guild.id, message.author.id, message.guild.id, message.author.id);
  } catch (error) {
    log.error("messageCreate", `Error al procesar mensaje para ${message.author?.tag || message.author?.id} en ${message.guild.name}:`, error.message);
  }
}

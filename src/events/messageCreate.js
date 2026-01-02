import { incrementMessageCount } from "../db.js";
import * as MessagesRepo from "../modules/moderation/db/messages.repo.js";
import { handlePrefixCommand } from "../core/commands/adapters/prefixAdapter.js";

export default async function messageCreate(client, message) {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (message.system) return;

  // Intentar procesar prefix command primero
  const handled = await handlePrefixCommand(message);
  if (handled) {
    return; // Si se procesó un comando, no continuar con el logging
  }

  try {
    incrementMessageCount.run(message.guild.id, message.author.id);
    
    const content = message.content ? (message.content.length > 200 ? message.content.substring(0, 200) : message.content) : null;
    MessagesRepo.insertMessage.run(
      message.guild.id,
      message.author.id,
      message.channel.id,
      message.id,
      content,
      Date.now()
    );
    MessagesRepo.cleanupOldMessages.run(message.guild.id, message.author.id, message.guild.id, message.author.id);
  } catch (error) {
    console.error(`[messageCreate] Error al procesar mensaje para ${message.author?.tag || message.author?.id} en ${message.guild.name}:`, error.message);
  }
}


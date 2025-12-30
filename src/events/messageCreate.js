import { incrementMessageCount } from "../db.js";

export default async function messageCreate(client, message) {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (message.system) return;

  try {
    incrementMessageCount.run(message.guild.id, message.author.id);
  } catch (error) {
    console.error(`[messageCreate] Error al incrementar contador de mensajes para ${message.author?.tag || message.author?.id} en ${message.guild.name}:`, error.message);
  }
}


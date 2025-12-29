import { incrementMessageCount } from "../db.js";

export default async function messageCreate(client, message) {
  // Solo procesar mensajes en servidores
  if (!message.guild) return;

  // FILTRO DE BOTS: ignorar bots completamente
  if (message.author?.bot) return;

  // Ignorar mensajes del sistema
  if (message.system) return;

  // Incrementar contador de mensajes
  try {
    incrementMessageCount.run(message.guild.id, message.author.id);
  } catch {
    // Ignorar errores silenciosamente
  }
}


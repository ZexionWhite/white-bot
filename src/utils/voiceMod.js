import { voiceModEmbed, createVoiceModComponents } from "./embeds.js";

// Helper para actualizar el embed de moderación
export async function updateVoiceModEmbed(client, channelId, guildId) {
  const key = `${guildId}_${channelId}`;
  const ref = client.voiceModMessages.get(key);
  if (!ref) return;

  try {
    const channel = await client.guilds.cache.get(guildId)?.channels.fetch(channelId).catch(() => null);
    if (!channel?.isVoiceBased()) {
      client.voiceModMessages.delete(key);
      return;
    }

    const members = Array.from(channel.members.values());
    if (members.length === 0) {
      // Si no hay usuarios, eliminar la referencia
      client.voiceModMessages.delete(key);
      return;
    }

    // Obtener el mensaje
    const messageChannel = await client.guilds.cache.get(guildId)?.channels.fetch(ref.channelId).catch(() => null);
    if (!messageChannel?.isTextBased()) {
      client.voiceModMessages.delete(key);
      return;
    }

    const message = await messageChannel.messages.fetch(ref.messageId).catch(() => null);
    if (!message) {
      client.voiceModMessages.delete(key);
      return;
    }

    // Obtener el moderador original (o usar el primer miembro)
    const moderator = await client.guilds.cache.get(guildId)?.members.fetch(ref.moderatorId).catch(() => null) || members[0];
    
    // Si hay un targetMember guardado (de voiceuser), obtenerlo
    let targetMember = null;
    if (ref.targetMemberId) {
      targetMember = await client.guilds.cache.get(guildId)?.members.fetch(ref.targetMemberId).catch(() => null);
    }
    
    const embed = voiceModEmbed(channel, members, moderator, client);
    const components = createVoiceModComponents(channel, members, moderator, targetMember, client);

    await message.edit({ embeds: [embed], components });
  } catch (error) {
    // Si falla, eliminar la referencia
    client.voiceModMessages.delete(key);
  }
}


import { voiceModEmbed, createVoiceModComponents } from "./embeds.js";
import { log } from "../../../core/logger/index.js";

export async function updateVoiceModEmbed(client, channelId, guildId) {
  const key = `${guildId}_${channelId}`;
  const ref = client.voiceModMessages.get(key);
  if (!ref) return;

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      client.voiceModMessages.delete(key);
      return;
    }

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isVoiceBased()) {
      client.voiceModMessages.delete(key);
      return;
    }

    const memberIds = Array.from(channel.members.keys());
    const refreshedMembers = await Promise.all(
      memberIds.map(id => guild.members.fetch({ user: id, force: true }).catch(() => null))
    );
    const members = refreshedMembers.filter(m => m && m.voice?.channel?.id === channelId);
    
    if (members.length === 0) {
      client.voiceModMessages.delete(key);
      return;
    }

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

    const moderator = await client.guilds.cache.get(guildId)?.members.fetch(ref.moderatorId).catch(() => null) || members[0];
    
    let targetMember = null;
    if (ref.targetMemberId) {
      targetMember = await client.guilds.cache.get(guildId)?.members.fetch(ref.targetMemberId).catch(() => null);
    }
    
    const embed = voiceModEmbed(channel, members, moderator, client);
    const components = createVoiceModComponents(channel, members, moderator, targetMember, client);

    await message.edit({ embeds: [embed], components });
  } catch (error) {
    log.error("voiceMod", `Error al actualizar embed de moderación de voz para canal ${channelId} en guild ${guildId}:`, error);
    client.voiceModMessages.delete(key);
  }
}


import { EmbedBuilder } from "discord.js";
import { TZ } from "../../../config.js";
import { formatDuration } from "../../../utils/time.js";

export function voiceStateEmbed(oldState, newState, session = null) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const member = newState.member ?? oldState.member;
  if (!member) return null;

  const username = member.user?.tag ?? member.displayName ?? "Desconocido";
  const userId = member.id ?? "Desconocido";

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const oldChannelId = oldChannel?.id ?? null;
  const newChannelId = newChannel?.id ?? null;

  let eventType, color, title, description, fields = [];

  if (!oldChannel && newChannel) {
    eventType = "join";
    color = 0x2ecc71;
    title = "🔊 Usuario se unió a voz";
    description = `**${username}** (\`${userId}\`) se unió a un canal de voz.`;
    fields.push({
      name: "Canal",
      value: `<#${newChannelId}>`,
      inline: true
    });
  }
  else if (oldChannel && !newChannel) {
    eventType = "leave";
    color = 0xed4245;
    title = "🔇 Usuario salió de voz";
    description = `**${username}** (\`${userId}\`) salió del canal de voz.`;
    fields.push({
      name: "Canal anterior",
      value: `<#${oldChannelId}>`,
      inline: true
    });
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: "Tiempo en canal",
          value: formatDuration(durationSeconds),
          inline: true
        });
      }
    }
  }
  else if (oldChannel && newChannel && oldChannelId !== newChannelId) {
    eventType = "move";
    color = 0xf1c40f;
    title = "🔄 Usuario se movió de canal";
    description = `**${username}** (\`${userId}\`) cambió de canal de voz.`;
    fields.push(
      {
        name: "Desde",
        value: `<#${oldChannelId}>`,
        inline: true
      },
      {
        name: "Hacia",
        value: `<#${newChannelId}>`,
        inline: true
      }
    );
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: "Tiempo en canal anterior",
          value: formatDuration(durationSeconds),
          inline: true
        });
      }
    }
  }
  else {
    return null;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .addFields(fields)
    .setTimestamp()
    .setFooter({
      text: `Voice state update • ${when}`,
      iconURL: member.guild?.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  if (member.user) {
    embed.setThumbnail(member.user.displayAvatarURL({ size: 128 }));
  }

  return embed;
}

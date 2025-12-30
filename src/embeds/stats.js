import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../utils/time.js";

export function userStatsEmbed(member, stats) {
  const username = member.user?.tag ?? member.displayName ?? "Desconocido";
  const userId = member.id ?? "Desconocido";
  
  const voiceTime = stats?.total_voice_seconds ?? 0;
  const messageCount = stats?.message_count ?? 0;
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 Estadísticas de ${username}`)
    .setDescription(`Estadísticas de actividad en **${member.guild.name}**`)
    .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) ?? null)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "⏱️ Tiempo en voz",
        value: formatDuration(voiceTime),
        inline: true
      },
      {
        name: "💬 Mensajes",
        value: messageCount.toLocaleString("es-AR"),
        inline: true
      },
      {
        name: "👤 Usuario",
        value: `<@${userId}>`,
        inline: true
      }
    )
    .setTimestamp()
    .setFooter({
      text: `ID: ${userId}`,
      iconURL: member.guild?.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  return embed;
}


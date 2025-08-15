import { EmbedBuilder } from "discord.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";

function truncate(str, n = 1000) {
  if (!str) return "(no content)";
  const s = String(str);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default async function messageUpdate(client, oldMessage, newMessage) {
  // Solo en guilds
  if (!newMessage?.guild) return;

  // Ignorar bots
  if (newMessage.author?.bot) return;

  const cfg = getSettings.get(newMessage.guild.id);
  const logId = cfg?.message_log_channel_id;
  if (!logId) return;

  const logCh = await newMessage.guild.channels.fetch(logId).catch(() => null);
  if (!logCh?.isTextBased()) return;

  // Completar parciales si se puede
  try { if (oldMessage?.partial) oldMessage = await oldMessage.fetch(); } catch {}
  try { if (newMessage?.partial) newMessage = await newMessage.fetch(); } catch {}

  const before = oldMessage?.content ?? "(uncached)";
  const after  = newMessage?.content ?? "(no content)";

  // Adjuntos
  const oldAtt = Array.from(oldMessage?.attachments?.values?.() ?? []).map(a => a.url);
  const newAtt = Array.from(newMessage?.attachments?.values?.() ?? []).map(a => a.url);

  // Si no cambió nada relevante, no spamear
  if (before === after && oldAtt.join() === newAtt.join()) return;

  const authorTag = newMessage.author?.tag
    ?? newMessage.member?.user?.tag
    ?? (newMessage.author?.id ? `<@${newMessage.author.id}>` : "Desconocido");
  const authorId = newMessage.author?.id ?? newMessage.member?.id ?? "Desconocido";

  const channelMention = newMessage.channelId ? `<#${newMessage.channelId}>` : "(unknown)";

  const attachmentsText = newAtt.length
    ? newAtt.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join("\n") + (newAtt.length > 5 ? `\n+${newAtt.length - 5} más` : "")
    : "—";

  const guildIcon = newMessage.guild.iconURL({ size: 64, extension: "png" }) ?? undefined;

  const embed = new EmbedBuilder()
    .setTitle("<:message_updated:1405708704330027038> Message Edited")
    .setDescription(
      [
        `**User:** ${authorTag} (\`${authorId}\`)`,
        `**Channel:** ${channelMention}`,
        newMessage.url ? `[Jump to message](${newMessage.url})` : ""
      ].filter(Boolean).join("\n")
    )
    .addFields(
      { name: "Before", value: "```\n" + truncate(before, 1000) + "\n```" },
      { name: "After",  value: "```\n" + truncate(after, 1000)  + "\n```" },
      { name: "Attachments (after)", value: attachmentsText }
    )
    .setColor(0xf1c40f)
    .setTimestamp() // momento de la edición
    .setFooter({
      text: `Message ID: ${newMessage.id}`,
      iconURL: guildIcon
    });

  await logCh.send({ embeds: [embed] }).catch(() => {});
}

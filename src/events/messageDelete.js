import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { EMOJIS } from "../config/emojis.js";

function truncate(str, n = 1000) {
  if (!str) return "(no content)";
  const s = String(str);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default async function messageDelete(client, message) {
  if (!message?.guild) return;

  const cfg = getSettings.get(message.guild.id);
  const logId = cfg?.message_log_channel_id;
  if (!logId) return;

  const logCh = await message.guild.channels.fetch(logId).catch(() => null);
  if (!logCh?.isTextBased()) return;

  const authorTag = message.author?.tag ?? message.member?.user?.tag ?? "Desconocido";
  const authorId  = message.author?.id  ?? message.member?.id       ?? "Desconocido";
  const channelMention = message.channel?.id ? `<#${message.channel.id}>` : "(unknown)";

  let deleter = null;
  try {
    const logs = await message.guild.fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
      limit: 5
    });
    const now = Date.now();
    for (const [, entry] of logs.entries) {
      const recent = now - entry.createdTimestamp < 5_000; // ventana 5s
      const sameChannel = entry.extra?.channel?.id === message.channel?.id;
      const sameTarget  = !message.author || entry.target?.id === message.author.id;
      if (recent && sameChannel && sameTarget) {
        deleter = entry.executor ?? null;
        break;
      }
    }
  } catch {
  }

  const content = message.content ?? (message.partial ? "(uncached)" : "(no content)");

  const attachments = Array.from(message.attachments?.values?.() ?? []);
  const attachText = attachments.length
    ? attachments
        .slice(0, 5)
        .map((a, i) => `${i + 1}. ${a.url}`)
        .join("\n") + (attachments.length > 5 ? `\n+${attachments.length - 5} más` : "")
    : "—";

  const whenFmt = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const createdUnix = message.createdTimestamp
  ? Math.floor(message.createdTimestamp / 1000)
  : null;

    const footerText = [
    `Message ID: ${message.id ?? "unknown"}`].join(" • ");

    const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.LOGS.MESSAGE_DELETED} Message Deleted`)
    .setDescription(
        [
        `**User:** ${authorTag} (\`${authorId}\`)`,
        `**Deleted by:** ${deleter ? `${deleter.tag} (\`${deleter.id}\`)` : "(unknown)"}`,
        `**Channel:** ${channelMention}`
        ].join("\n")
    )
    .addFields(
        { name: "Message", value: "```\n" + truncate(content, 1000) + "\n```" },
        { name: "Attachments", value: attachText }
    )
    .setColor(0xed4245)
    .setTimestamp()
    .setFooter({
        text: footerText,
        iconURL: message.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  await logCh.send({ embeds: [embed] }).catch(() => {});
}

import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getSettings } from "../db.js";
import { TZ } from "../config.js";
import { EMOJIS } from "../config/emojis.js";
import { log } from "../core/logger/index.js";
import { sendLog } from "../core/webhooks/index.js";
import { t, getLocaleForGuild } from "../core/i18n/index.js";

function truncate(str, n = 1000) {
  if (!str) return "(no content)";
  const s = String(str);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default async function messageDelete(client, message) {
  if (!message?.guild) return;

  const cfg = await getSettings.get(message.guild.id);
  const logId = cfg?.message_log_channel_id;
  if (!logId) return;

  const logCh = await message.guild.channels.fetch(logId).catch((err) => {
    console.error(`[messageDelete] Error al obtener canal de logs ${logId} en ${message.guild.name}:`, err.message);
    return null;
  });
  if (!logCh?.isTextBased()) return;

  const locale = await getLocaleForGuild(message.guild);
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
  } catch (err) {
    log.warn("messageDelete", `Error al obtener audit log en ${message.guild.name}:`, err.message);
  }

  const content = message.content ?? (message.partial ? "(uncached)" : "(no content)");

  const attachments = Array.from(message.attachments?.values?.() ?? []);
  const attachText = attachments.length
    ? attachments
        .slice(0, 5)
        .map((a, i) => `${i + 1}. ${a.url}`)
        .join("\n") + (attachments.length > 5 ? `\n+${attachments.length - 5} más` : "")
    : "—";

  const userDisplay = `${authorTag} (\`${authorId}\`)`;
  const deleterDisplay = deleter ? `${deleter.tag} (\`${deleter.id}\`)` : "(unknown)";

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.LOGS.MESSAGE_DELETED} ${t(locale, "logging.events.message_deleted.title")}`)
    .setDescription(
        [
        t(locale, "logging.events.message_deleted.description_user", { user: userDisplay }),
        t(locale, "logging.events.message_deleted.description_deleter", { deleter: deleterDisplay }),
        t(locale, "logging.events.message_deleted.description_channel", { channel: channelMention })
        ].join("\n")
    )
    .addFields(
        { name: t(locale, "logging.events.message_deleted.field_message"), value: "```\n" + truncate(content, 1000) + "\n```" },
        { name: t(locale, "logging.events.message_deleted.field_attachments"), value: attachText }
    )
    .setColor(0xed4245)
    .setTimestamp()
    .setFooter({
        text: t(locale, "logging.events.message_deleted.footer_message_id", { messageId: message.id ?? "unknown" }),
        iconURL: message.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  await sendLog(logCh, { embeds: [embed] }, "message").catch((err) => {
    log.error("messageDelete", `Error al enviar log de eliminación en ${message.guild.name}:`, err.message);
  });
}

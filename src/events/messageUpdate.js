import { EmbedBuilder } from "discord.js";
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

export default async function messageUpdate(client, oldMessage, newMessage) {
  if (!newMessage?.guild) return;
  if (newMessage.author?.bot) return;

  const cfg = await getSettings.get(newMessage.guild.id);
  const logId = cfg?.message_log_channel_id;
  if (!logId) return;

  const logCh = await newMessage.guild.channels.fetch(logId).catch((err) => {
    log.error("messageUpdate", `Error al obtener canal de logs ${logId} en ${newMessage.guild.name}:`, err.message);
    return null;
  });
  if (!logCh?.isTextBased()) return;

  try { if (oldMessage?.partial) oldMessage = await oldMessage.fetch(); } catch (err) {
    log.warn("messageUpdate", `Error al fetch oldMessage parcial:`, err.message);
  }
  try { if (newMessage?.partial) newMessage = await newMessage.fetch(); } catch (err) {
    log.warn("messageUpdate", `Error al fetch newMessage parcial:`, err.message);
  }

  const before = oldMessage?.content ?? "(uncached)";
  const after  = newMessage?.content ?? "(no content)";

  const oldAtt = Array.from(oldMessage?.attachments?.values?.() ?? []).map(a => a.url);
  const newAtt = Array.from(newMessage?.attachments?.values?.() ?? []).map(a => a.url);

  if (before === after && oldAtt.join() === newAtt.join()) return;

  const locale = await getLocaleForGuild(newMessage.guild);
  const authorTag = newMessage.author?.tag
    ?? newMessage.member?.user?.tag
    ?? (newMessage.author?.id ? `<@${newMessage.author.id}>` : "Desconocido");
  const authorId = newMessage.author?.id ?? newMessage.member?.id ?? "Desconocido";

  const channelMention = newMessage.channelId ? `<#${newMessage.channelId}>` : "(unknown)";

  const attachmentsText = newAtt.length
    ? newAtt.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join("\n") + (newAtt.length > 5 ? `\n+${newAtt.length - 5} más` : "")
    : "—";

  const guildIcon = newMessage.guild.iconURL({ size: 64, extension: "png" }) ?? undefined;

  const userDisplay = `${authorTag} (\`${authorId}\`)`;

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.LOGS.MESSAGE_UPDATED} ${t(locale, "logging.events.message_updated.title")}`)
    .setDescription(
      [
        t(locale, "logging.events.message_updated.description_user", { user: userDisplay }),
        t(locale, "logging.events.message_updated.description_channel", { channel: channelMention }),
        newMessage.url ? `[Jump to message](${newMessage.url})` : ""
      ].filter(Boolean).join("\n")
    )
    .addFields(
      { name: t(locale, "logging.events.message_updated.field_before"), value: "```\n" + truncate(before, 1000) + "\n```" },
      { name: t(locale, "logging.events.message_updated.field_after"),  value: "```\n" + truncate(after, 1000)  + "\n```" },
      { name: t(locale, "logging.events.message_updated.field_attachments_after"), value: attachmentsText }
    )
    .setColor(0xf1c40f)
    .setTimestamp()
    .setFooter({
      text: t(locale, "logging.events.message_updated.footer_message_id", { messageId: newMessage.id }),
      iconURL: guildIcon
    });

  await sendLog(logCh, { embeds: [embed] }, "message").catch((err) => {
    log.error("messageUpdate", `Error al enviar log de edición en ${newMessage.guild.name}:`, err.message);
  });
}

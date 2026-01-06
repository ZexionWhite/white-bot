import { EmbedBuilder } from "discord.js";
import { TZ } from "../../../config.js";
import { formatDuration } from "../../../utils/time.js";
import { t, getLocaleForGuild, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export async function voiceStateEmbed(oldState, newState, session = null, locale = null) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const member = newState.member ?? oldState.member;
  if (!member) return null;

  if (!locale && member.guild) {
    locale = await getLocaleForGuild(member.guild);
  }

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
    title = t(locale, "logging.voice.joined.title");
    description = t(locale, "logging.voice.joined.description", { username, userId });
    fields.push({
      name: t(locale, "logging.voice.joined.field_channel"),
      value: `<#${newChannelId}>`,
      inline: true
    });
  }
  else if (oldChannel && !newChannel) {
    eventType = "leave";
    color = 0xed4245;
    title = t(locale, "logging.voice.left.title");
    description = t(locale, "logging.voice.left.description", { username, userId });
    fields.push({
      name: t(locale, "logging.voice.left.field_previous_channel"),
      value: `<#${oldChannelId}>`,
      inline: true
    });
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: t(locale, "logging.voice.left.field_time_in_channel"),
          value: formatDuration(durationSeconds),
          inline: true
        });
      }
    }
  }
  else if (oldChannel && newChannel && oldChannelId !== newChannelId) {
    eventType = "move";
    color = 0xf1c40f;
    title = t(locale, "logging.voice.moved.title");
    description = t(locale, "logging.voice.moved.description", { username, userId });
    fields.push(
      {
        name: t(locale, "logging.voice.moved.field_from"),
        value: `<#${oldChannelId}>`,
        inline: true
      },
      {
        name: t(locale, "logging.voice.moved.field_to"),
        value: `<#${newChannelId}>`,
        inline: true
      }
    );
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: t(locale, "logging.voice.moved.field_time_in_previous_channel"),
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
      text: t(locale, `logging.voice.${eventType}.footer`, { when }),
      iconURL: member.guild?.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  if (member.user) {
    embed.setThumbnail(member.user.displayAvatarURL({ size: 128 }));
  }

  return embed;
}

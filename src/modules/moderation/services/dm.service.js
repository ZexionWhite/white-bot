import { EmbedBuilder } from "discord.js";
import { formatDurationMs } from "../../../utils/duration.js";
import { TYPE_COLORS, TYPE_NAMES } from "../ui/embeds.js";

const ACTION_TITLES = {
  WARN: "You have been warned",
  MUTE: "You have been muted",
  UNMUTE: "You have been unmuted",
  TIMEOUT: "You have been timed out",
  UNTIMEOUT: "Your timeout has been removed",
  KICK: "You have been kicked",
  BAN: "You have been banned",
  TEMPBAN: "You have been temporarily banned",
  SOFTBAN: "You have been softbanned",
  UNBAN: "You have been unbanned"
};

export async function sendPunishmentDM(user, action, reason, caseId, guildName, duration = null, created_at = null) {
  if (!user) return false;

  const actionName = TYPE_NAMES[action] || action.toLowerCase();
  const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
  const title = ACTION_TITLES[action] || `You have been ${actionName}`;
  
  // Build description matching the modlog format
  let description = `**Server:** ${guildName}\n**Member:** ${user.tag || user.username || "Unknown"} (${user.id})\n**Action:** ${actionCapitalized}`;
  
  // Duration first (if exists), then Reason last
  if (duration) {
    const durationFormatted = formatDurationMs(duration);
    description += `\n**Duration:** ${durationFormatted}`;
  }
  
  description += `\n**Reason:** ${reason || "No reason"}`;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(TYPE_COLORS[action] || 0xffaa00)
    .setDescription(description)
    .setFooter({ text: `Case #${caseId}` });

  if (created_at) {
    embed.setTimestamp(created_at);
  }

  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    return false;
  }
}


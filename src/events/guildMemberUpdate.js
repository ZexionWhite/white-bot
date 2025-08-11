import { boosterEmbed } from "../utils/embeds.js";
import { getSettings } from "../db.js";

export default async function guildMemberUpdate(client, oldM, newM) {
  // Puede que oldM sea parcial; defensivo:
  const had = Boolean(oldM?.premiumSince);
  const has = Boolean(newM?.premiumSince);

  const started = !had && has;
  if (!started) return;

  const cfg = getSettings.get(newM.guild.id);
  const channelId = cfg?.booster_announce_channel_id;
  if (!channelId) return;

  const ch = await newM.guild.channels.fetch(channelId).catch(() => null);
  if (!ch?.isTextBased()) return;

  const autoBoosterRoleId =
    newM.guild.roles.cache.find(r => r.tags?.premiumSubscriberRole)?.id ?? null;
  const boosterRoleId = cfg?.booster_role_id ?? autoBoosterRoleId;

  const infoChannelId = cfg?.info_channel_id ?? null;

  const embed = boosterEmbed(newM, { boosterRoleId, infoChannelId });
  await ch.send({ embeds: [embed] }).catch(() => {});
}

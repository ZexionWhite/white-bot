import { EmbedBuilder } from "discord.js";
import { TZ, BOOST_GIF_URL } from "../config.js";
import { EMOJIS } from "../config/emojis.js";

export function boosterEmbed(
  member,
  {
    gifUrl = BOOST_GIF_URL,
    boosterRoleId,   
    infoChannelId    
  } = {}
) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const username =
    member.displayName ?? member.user.globalName ?? member.user.username;

  const boosts = member.guild.premiumSubscriptionCount ?? 0;

  const autoBoosterRole = member.guild.roles.cache.find(r => r.tags?.premiumSubscriberRole);
  const roleIdToMention = boosterRoleId ?? autoBoosterRole?.id ?? null;
  const boosterMention = roleIdToMention ? `<@&${roleIdToMention}>` : "Server Booster";

  const descLines = [
    `En agradecimiento por la mejora, se te ha otorgado el rol de ${boosterMention}.`
  ];
  if (infoChannelId) {
    descLines.push(`• Puedes revisar tus ventajas en <#${infoChannelId}>.`);
  }

  return new EmbedBuilder()
    .setTitle(`${EMOJIS.BOOST.DEV_WHITEBOOSTER} ¡**${username}** ha boosteado **${member.guild.name}**!`)
    .setDescription(descLines.join("\n"))
    .setImage(gifUrl)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(0xf47fff)
    .setFooter({
      text: `${when} • ${boosts} boosts actuales`,
      iconURL: member.guild.iconURL({ size: 32, extension: 'png' }) ?? undefined
    });
}


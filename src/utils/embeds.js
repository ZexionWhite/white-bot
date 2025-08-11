import { EmbedBuilder } from "discord.js";
import { TZ, WELCOME_GIF_URL, BOOST_GIF_URL } from "../config.js";

export function welcomeEmbed(member, {
  gifUrl = WELCOME_GIF_URL,
  autorolesChannelId,
} = {}) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const username =
    member.displayName ??
    member.user.globalName ??
    member.user.username;

  const tip = autorolesChannelId
    ? `• Elegí tu color en <#${autorolesChannelId}>.`
    : "• Pstt... no olvides leer las reglas.";

  return new EmbedBuilder()
    .setTitle(`¡Bienvenido a ${member.guild.name}!`)
    .setDescription(`**${username}**, nos encanta tenerte acá.\n${tip}`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setImage(gifUrl)
    .setColor(0x5865f2)
    .setFooter({ text: `Se unió el ${when}` });
}

export function logJoinEmbed(member) {
  return new EmbedBuilder()
    .setTitle("<:user_joined:1404291903465455809> User joined")
    .setDescription(`**${member.user.tag}** (\`${member.id}\`) joined the guild.`)
    .setTimestamp()
    .setColor(0x95a5a6);
}


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

  // Rol “Server Booster”: usa el provisto o detecta el automático del server
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
    .setTitle(`<:dev_whitebooster:1404272356905713674> ¡**${username}** ha boosteado **${member.guild.name}**!`)
    .setDescription(descLines.join("\n"))
    .setImage(gifUrl)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(0xf47fff)
    .setFooter({
      text: `${when} • ${boosts} boosts actuales`,
      iconURL: member.guild.iconURL({ size: 32, extension: 'png' }) ?? undefined
    });
}

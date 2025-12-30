import { EmbedBuilder } from "discord.js";
import { TZ, WELCOME_GIF_URL } from "../config.js";
import { EMOJIS } from "../config/emojis.js";

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
    .setTitle(`${EMOJIS.LOGS.USER_JOINED} User joined`)
    .setDescription(`**${member.user.tag}** (\`${member.id}\`) joined the guild.`)
    .setTimestamp()
    .setColor(0x95a5a6);
}


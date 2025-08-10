import { EmbedBuilder } from "discord.js";
import { TZ, WELCOME_GIF_URL, BOOST_GIF_URL} from "../config.js";

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

  // un único bullet “agradable”; si no hay canal configurado, queda genérico
  const tip = autorolesChannelId
    ? `• Tip: elegí tu color en <#${autorolesChannelId}>.`
    : "• Tip: elegí tu color para arrancar con estilo.";

  return new EmbedBuilder()
    .setTitle(`¡Bienvenido a ${member.guild.name}!`)
    .setDescription(`**${username}**, nos encanta tenerte acá.\n${tip}`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 })) // foto a la derecha
    .setImage(gifUrl)                                          // GIF grande abajo
    .setColor(0x5865f2)
    .setFooter({ text: `Se unió el ${when}` });
}
export function logJoinEmbed(member) {
  return new EmbedBuilder()
    .setTitle("📝 Registro de ingreso")
    .setDescription(`**${member.user.tag}** (\`${member.id}\`) se unió.`)
    .setTimestamp()
    .setColor(0x95a5a6);
}

export function boosterEmbed(member, { gifUrl = BOOST_GIF_URL } = {}) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const username = member.displayName ?? member.user.globalName ?? member.user.username;
  const boosts = member.guild.premiumSubscriptionCount ?? 0;

  const desc = [
    `**${username}**, ¡gracias por apoyar a **${member.guild.name}**!`,
    "• Tip: tu boost ayuda a desbloquear perks y a que todo se vea más facha."
  ].join("\n");

  return new EmbedBuilder()
    .setTitle(`🚀 Gracias por boostear ${username}`)
    .setDescription(desc)
    .setImage(gifUrl) // GIF grande abajo (capybara)
    // Si te parece repetitivo, no ponemos thumbnail. Si lo querés, descomentá:
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(0xf47fff)
    .setFooter({ text: `Anunciado el ${when} • ${boosts} boosts actuales` });
}
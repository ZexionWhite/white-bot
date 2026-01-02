import { EmbedBuilder } from "discord.js";
import { WELCOME_GIF_URL } from "../../../config.js";

export function welcomeEmbed(member, { autorolesChannelId = null } = {}) {
  const embed = new EmbedBuilder()
    .setTitle(`¡Bienvenido/a a ${member.guild.name}!`)
    .setThumbnail(member.user.displayAvatarURL({ size: 128, extension: "png" }))
    .setImage(WELCOME_GIF_URL)
    .setColor(0x5865f2)
    .setTimestamp();

  if (autorolesChannelId) {
    embed.setDescription(`• Lee las <#${autorolesChannelId}> para más información\n• ¡Disfruta tu estadía!`);
  }

  return embed;
}

export function logJoinEmbed(member) {
  const embed = new EmbedBuilder()
    .setTitle("📥 Miembro Unido")
    .setDescription(`**${member.user.tag}** (${member.id})`)
    .setThumbnail(member.user.displayAvatarURL({ size: 64, extension: "png" }))
    .addFields(
      { name: "Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Miembros totales", value: `${member.guild.memberCount}`, inline: true }
    )
    .setColor(0x57f287)
    .setTimestamp();

  return embed;
}

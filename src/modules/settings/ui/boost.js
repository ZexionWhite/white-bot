import { EmbedBuilder } from "discord.js";
import { BOOST_GIF_URL } from "../../../config.js";
import { EMOJIS } from "../../../config/emojis.js";

export function boosterEmbed(member, { boosterRoleId = null, infoChannelId = null } = {}) {
  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.BOOST.BOOSTER} ¡Nuevo Booster!`)
    .setDescription(`**${member.user.tag}** acaba de boostear el servidor`)
    .setThumbnail(member.user.displayAvatarURL({ size: 128, extension: "png" }))
    .setImage(BOOST_GIF_URL)
    .setColor(0xf47fff)
    .setTimestamp();

  const boostCount = member.guild.premiumSubscriptionCount || 0;
  embed.setFooter({ 
    text: `${boostCount} ${boostCount === 1 ? "boost" : "boosts"} • ${new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Cordoba" })}`,
    iconURL: member.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
  });

  if (infoChannelId) {
    embed.addFields({ name: `${EMOJIS.BOOST.BOOSTER} Perks`, value: `Mira <#${infoChannelId}> para ver los beneficios` });
  }

  return embed;
}

import { EmbedBuilder } from "discord.js";
import { BOOST_GIF_URL, TZ } from "../../../config.js";
import { EMOJIS } from "../../../config/emojis.js";
import { t, getLocaleForGuild, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export async function boosterEmbed(member, { boosterRoleId = null, infoChannelId = null } = {}, locale = null) {
  if (!locale) {
    locale = await getLocaleForGuild(member.guild);
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.BOOST.BOOSTER} ${t(locale, "config.boost.title")}`)
    .setDescription(t(locale, "config.boost.description", { tag: member.user.tag }))
    .setThumbnail(member.user.displayAvatarURL({ size: 128, extension: "png" }))
    .setImage(BOOST_GIF_URL)
    .setColor(0xf47fff)
    .setTimestamp();

  const boostCount = member.guild.premiumSubscriptionCount || 0;
  const when = new Intl.DateTimeFormat(locale === "es-ES" ? "es-AR" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());
  
  const plural = boostCount !== 1 ? "s" : "";
  embed.setFooter({ 
    text: t(locale, "config.boost.footer", { count: boostCount, plural, when }),
    iconURL: member.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
  });

  if (infoChannelId) {
    embed.addFields({ 
      name: `${EMOJIS.BOOST.BOOSTER} ${t(locale, "config.boost.field_perks")}`, 
      value: t(locale, "config.boost.field_perks_value", { channelId: infoChannelId })
    });
  }

  return embed;
}

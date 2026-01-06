import { EmbedBuilder } from "discord.js";
import { WELCOME_GIF_URL } from "../../../config.js";
import { t, getLocaleForGuild, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

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

export async function logJoinEmbed(member, locale = null) {
  if (!locale) {
    locale = await getLocaleForGuild(member.guild);
  }
  
  const tag = member.user.tag;
  const id = member.id;
  
  const embed = new EmbedBuilder()
    .setTitle(t(locale, "logging.events.user_joined.title"))
    .setDescription(t(locale, "logging.events.user_joined.description", { tag, id }))
    .setThumbnail(member.user.displayAvatarURL({ size: 64, extension: "png" }))
    .addFields(
      { name: t(locale, "logging.events.user_joined.field_account_created"), value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: t(locale, "logging.events.user_joined.field_total_members"), value: `${member.guild.memberCount}`, inline: true }
    )
    .setColor(0x57f287)
    .setTimestamp();

  return embed;
}

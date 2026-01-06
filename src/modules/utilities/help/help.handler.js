import { getEmbedByCategory } from "./help.embed.js";
import { createHelpSelectMenu } from "./help.menu.js";
import { createCloseButton } from "./help.buttons.js";
import { getLocaleForGuild, t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";
import { MessageFlags } from "discord.js";

export async function handleHelpCommand(itx, client) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  const embed = getEmbedByCategory("intro", client, locale);
  const selectMenu = createHelpSelectMenu("intro", locale);
  const closeButton = createCloseButton(locale);

  return itx.reply({
    embeds: [embed],
    components: [selectMenu, closeButton],
    flags: itx.guild ? undefined : MessageFlags.Ephemeral
  });
}

export async function handleHelpSelect(itx, client) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  const selectedCategory = itx.values[0];
  const embed = getEmbedByCategory(selectedCategory, client, locale);
  const selectMenu = createHelpSelectMenu(selectedCategory, locale);
  const closeButton = createCloseButton(locale);

  return itx.update({
    embeds: [embed],
    components: [selectMenu, closeButton]
  });
}

export async function handleHelpClose(itx) {
  const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
  const message = itx.message;
  const commandUserId = message.interaction?.user?.id || message.author?.id;
  
  if (!commandUserId) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_verify")}`,
      flags: MessageFlags.Ephemeral
    });
  }

  if (itx.user.id !== commandUserId) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_permission")}`,
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    await message.delete();
  } catch (error) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_delete_error")}`,
      flags: MessageFlags.Ephemeral
    });
  }
}

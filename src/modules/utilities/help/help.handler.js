import { getEmbedByCategory } from "./help.embed.js";
import { createHelpSelectMenu } from "./help.menu.js";
import { createCloseButton } from "./help.buttons.js";
import { getLocaleForGuild, t } from "../../../core/i18n/index.js";

export async function handleHelpCommand(itx, client) {
  const locale = await getLocaleForGuild(itx.guild);
  const embed = getEmbedByCategory("intro", client, locale);
  const selectMenu = createHelpSelectMenu("intro", locale);
  const closeButton = createCloseButton(locale);

  return itx.reply({
    embeds: [embed],
    components: [selectMenu, closeButton],
    ephemeral: false
  });
}

export async function handleHelpSelect(itx, client) {
  const locale = await getLocaleForGuild(itx.guild);
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
  const locale = await getLocaleForGuild(itx.guild);
  const message = itx.message;
  const commandUserId = message.interaction?.user?.id || message.author?.id;
  
  if (!commandUserId) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_verify")}`,
      ephemeral: true
    });
  }

  if (itx.user.id !== commandUserId) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_permission")}`,
      ephemeral: true
    });
  }

  try {
    await message.delete();
  } catch (error) {
    return itx.reply({
      content: `❌ ${t(locale, "utilities.help.errors.close_delete_error")}`,
      ephemeral: true
    });
  }
}

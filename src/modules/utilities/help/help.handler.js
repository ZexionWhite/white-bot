import { getEmbedByCategory } from "./help.embed.js";
import { createHelpSelectMenu } from "./help.menu.js";
import { createCloseButton } from "./help.buttons.js";

export async function handleHelpCommand(itx, client) {
  const embed = getEmbedByCategory("intro", client);
  const selectMenu = createHelpSelectMenu("intro");
  const closeButton = createCloseButton();

  return itx.reply({
    embeds: [embed],
    components: [selectMenu, closeButton],
    ephemeral: false
  });
}

export async function handleHelpSelect(itx, client) {
  const selectedCategory = itx.values[0];
  const embed = getEmbedByCategory(selectedCategory, client);
  const selectMenu = createHelpSelectMenu(selectedCategory);
  const closeButton = createCloseButton();

  return itx.update({
    embeds: [embed],
    components: [selectMenu, closeButton]
  });
}

export async function handleHelpClose(itx) {
  const message = itx.message;
  const commandUserId = message.interaction?.user?.id || message.author?.id;
  
  if (!commandUserId) {
    return itx.reply({
      content: "❌ No se pudo verificar el propietario del mensaje.",
      ephemeral: true
    });
  }

  if (itx.user.id !== commandUserId) {
    return itx.reply({
      content: "❌ Solo el usuario que ejecutó el comando puede cerrar esta ayuda.",
      ephemeral: true
    });
  }

  try {
    await message.delete();
  } catch (error) {
    return itx.reply({
      content: "❌ No pude eliminar el mensaje. Puede que ya haya sido eliminado.",
      ephemeral: true
    });
  }
}


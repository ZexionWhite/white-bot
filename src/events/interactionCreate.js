import { PermissionFlagsBits } from "discord.js";
import * as utilitiesModule from "../modules/utilities/index.js";
import { commandHandlers, componentHandlers, autocompleteHandlers } from "../modules/registry.js";
import { handleVoiceModComponent } from "../utils/voiceModHandlers.js";

export default async function interactionCreate(client, itx) {
  try {
    if (itx.isAutocomplete()) {
      const name = itx.commandName;
      if (autocompleteHandlers[name]) {
        return autocompleteHandlers[name](itx);
      }
      return itx.respond([]);
    }

    if (itx.isModalSubmit()) {
      const customId = itx.customId;
      
      if (customId.startsWith("pending:")) {
        // Route to appropriate modal handler
        const { handleModerationModal } = await import("../modules/moderation/modals/handlers.js");
        const { handleBlacklistModal } = await import("../modules/blacklist/modals/handlers.js");
        
        // Determine which handler to use based on the pending action
        const actionId = parseInt(customId.replace("pending:", ""));
        if (!isNaN(actionId)) {
          const { getPendingAction } = await import("../modules/moderation/modals/helpers.js");
          const pendingAction = getPendingAction(actionId);
          
          if (pendingAction) {
            if (pendingAction.command.startsWith("blacklist.")) {
              return handleBlacklistModal(itx);
            } else {
              return handleModerationModal(itx);
            }
          }
        }
      }
      
      return itx.reply({ content: "Unknown modal", ephemeral: true });
    }
    
    if (itx.isChatInputCommand()) {
      const name = itx.commandName;
      console.log(`[interactionCreate] Comando ejecutado: ${name} por ${itx.user.tag} en ${itx.guild?.name || "DM"}`);
      
      if (!itx.inGuild() && name !== "test") {
        return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
      }

      // Handlers desde registry (moderation, blacklist, info, permissions, autoroles, settings, utilities)
      if (commandHandlers[name]) {
        return commandHandlers[name](itx);
      }

      // TODO: Migrar test al registry (solo para guild de pruebas)
      if (name === "test") {
        try {
          return utilitiesModule.handleTest(itx, client);
        } catch (error) {
          console.error("[interactionCreate] Error en comando test:", error);
          return itx.reply({ 
            content: `❌ Error al ejecutar el comando: ${error.message}`, 
            ephemeral: true 
          }).catch(() => {});
        }
      }
    }

    if (itx.isStringSelectMenu()) {
      const customId = itx.customId;
      
      // Handlers desde registry (color-select está en autorolesComponentHandlers, help/test en utilitiesComponentHandlers)
      if (componentHandlers[customId]) {
        return componentHandlers[customId](itx, customId);
      }

      // Handlers con prefijo para componentes del registry
      const prefix = customId.split(":")[0];
      if (componentHandlers[prefix]) {
        return componentHandlers[prefix](itx, customId);
      }

      // Voice moderation select menu (mod_menu_*)
      if (customId.startsWith("mod_menu_")) {
        const selectedValue = itx.values[0];
        // Crear un objeto similar a itx pero con customId del valor seleccionado
        const fakeItx = {
          ...itx,
          customId: selectedValue
        };
        const result = await handleVoiceModComponent(client, fakeItx, selectedValue);
        if (result !== null) return result;
      }
    }

    if (itx.isButton()) {
      const customId = itx.customId;

      // Handlers con prefijo para componentes del registry
      const prefix = customId.split(":")[0];
      if (componentHandlers[prefix]) {
        return componentHandlers[prefix](itx, customId);
      }

      // Voice moderation handlers (mod_*)
      if (customId.startsWith("mod_")) {
        const result = await handleVoiceModComponent(client, itx, customId);
        if (result !== null) return result;
      }
    }
  } catch (error) {
    console.error(`[interactionCreate] Error inesperado al procesar interacción:`, error.message);
    if (itx.isRepliable() && !itx.replied && !itx.deferred) {
      itx.reply({ content: "❌ Ocurrió un error al procesar esta interacción.", ephemeral: true }).catch(() => {});
    }
  }
}

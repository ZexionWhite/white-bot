import * as commandRegistry from "../commandRegistry.js";
import { createCommandContextFromInteraction } from "./context.js";

export function generateSlashHandlers() {
  const handlers = {};
  
  const commands = commandRegistry.getAllCommands();
  for (const cmd of commands) {
    handlers[cmd.name] = async (itx) => {
      try {
        const ctx = await createCommandContextFromInteraction(itx);
        return await cmd.execute(ctx);
      } catch (error) {
        console.error(`[SlashAdapter] Error ejecutando comando ${cmd.name}:`, error);
        if (itx.isRepliable() && !itx.replied && !itx.deferred) {
          return itx.reply({
            content: `❌ Error al ejecutar el comando: ${error.message}`,
            ephemeral: true
          }).catch(() => {});
        }
      }
    };
  }
  
  return handlers;
}

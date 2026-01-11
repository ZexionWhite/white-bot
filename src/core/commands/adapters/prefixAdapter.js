import * as commandRegistry from "../commandRegistry.js";
import { createCommandContextFromMessage } from "./context.js";
import { getSettings } from "../../../db.js";

const DEFAULT_PREFIX = "capy!";

async function getGuildPrefix(guildId) {
  if (!guildId) return DEFAULT_PREFIX;
  const settings = await getSettings.get(guildId);
  return settings?.command_prefix || DEFAULT_PREFIX;
}

export async function handlePrefixCommand(message) {
  if (!message.guild) return false;
  
  const content = message.content.trim();
  const prefix = await getGuildPrefix(message.guild.id);

  if (!content.toLowerCase().startsWith(prefix.toLowerCase())) {
    return false;
  }

  const args = content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args[0]?.toLowerCase();
  
  if (!commandName) {
    return false;
  }

  const command = commandRegistry.getCommand(commandName);
  if (!command) {
    return false;
  }
  
  try {
    
    let parsed = { rawArgs: args.slice(1) };
    if (command.argsSchema) {
      parsed = command.argsSchema.parse({
        
        rawArgs: args.slice(1)
      });
    }

    const ctx = await createCommandContextFromMessage(message, parsed);

    await command.execute(ctx);
    
    return true;
  } catch (error) {
    if (error.name === "ZodError") {
      
      const errors = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("\n");
      await message.reply({
        content: `❌ Error en los argumentos:\n${errors}\n\nUsa: \`${prefix}${commandName} <@usuario> [duración] <razón>\``
      }).catch(() => {});
    } else {
      console.error(`[PrefixAdapter] Error ejecutando ${commandName}:`, error);
      await message.reply({
        content: `❌ Error al ejecutar el comando: ${error.message}`
      }).catch(() => {});
    }
    return true; 
  }
}

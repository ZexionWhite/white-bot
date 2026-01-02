/**
 * Adapter para Prefix Commands
 * Soporta prefix configurable por servidor
 */

import * as commandRegistry from "../commandRegistry.js";
import { createCommandContextFromMessage } from "./context.js";
import { getSettings } from "../../../db.js";

const DEFAULT_PREFIX = "capy!";

/**
 * Obtiene el prefix del servidor
 * @param {string} guildId - ID del servidor
 * @returns {string} - Prefix configurado o default
 */
function getGuildPrefix(guildId) {
  if (!guildId) return DEFAULT_PREFIX;
  const settings = getSettings.get(guildId);
  return settings?.command_prefix || DEFAULT_PREFIX;
}

/**
 * Parsea un mensaje y ejecuta el comando si existe
 * @param {Message} message - Mensaje de Discord
 * @returns {Promise<boolean>} - true si se procesó un comando, false si no
 */
export async function handlePrefixCommand(message) {
  if (!message.guild) return false;
  
  const content = message.content.trim();
  const prefix = getGuildPrefix(message.guild.id);
  
  // Verificar prefijo (case-insensitive)
  if (!content.toLowerCase().startsWith(prefix.toLowerCase())) {
    return false;
  }
  
  // Extraer comando y argumentos
  const args = content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args[0]?.toLowerCase();
  
  if (!commandName) {
    return false;
  }
  
  // Buscar comando en registry
  const command = commandRegistry.getCommand(commandName);
  if (!command) {
    return false;
  }
  
  try {
    // Validar argumentos con zod
    const parsed = command.argsSchema.parse({
      // El parser de argumentos debe convertir args[1...] al formato esperado
      rawArgs: args.slice(1)
    });
    
    // Crear contexto
    const ctx = await createCommandContextFromMessage(message, parsed);
    
    // Ejecutar comando
    await command.execute(ctx);
    
    return true;
  } catch (error) {
    if (error.name === "ZodError") {
      // Error de validación
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
    return true; // Se procesó aunque haya error
  }
}

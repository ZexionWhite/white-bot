/**
 * Registro centralizado de comandos
 * Soporta tanto slash commands como prefix commands
 */

import { z } from "zod";

/** @type {Map<string, CommandDefinition>} */
const commands = new Map();

/** @type {Map<string, string>} - alias -> commandName */
const aliases = new Map();

/**
 * Registra un comando
 * @param {CommandDefinition} command - Definición del comando
 */
export function registerCommand(command) {
  commands.set(command.name, command);
  
  // Registrar aliases
  if (command.aliases && Array.isArray(command.aliases)) {
    for (const alias of command.aliases) {
      aliases.set(alias.toLowerCase(), command.name);
    }
  }
}

/**
 * Registra múltiples comandos
 * @param {CommandDefinition[]} commandList - Lista de comandos
 */
export function registerCommands(commandList) {
  for (const cmd of commandList) {
    registerCommand(cmd);
  }
}

/**
 * Obtiene un comando por nombre o alias
 * @param {string} nameOrAlias - Nombre o alias del comando
 * @returns {CommandDefinition|undefined}
 */
export function getCommand(nameOrAlias) {
  const normalized = nameOrAlias.toLowerCase();
  
  // Primero buscar por nombre exacto
  if (commands.has(normalized)) {
    return commands.get(normalized);
  }
  
  // Luego buscar por alias
  const actualName = aliases.get(normalized);
  if (actualName && commands.has(actualName)) {
    return commands.get(actualName);
  }
  
  return undefined;
}

/**
 * Obtiene todos los comandos registrados
 * @returns {CommandDefinition[]}
 */
export function getAllCommands() {
  return Array.from(commands.values());
}

/**
 * Verifica si un comando existe (por nombre o alias)
 * @param {string} nameOrAlias - Nombre o alias
 * @returns {boolean}
 */
export function hasCommand(nameOrAlias) {
  return getCommand(nameOrAlias) !== undefined;
}

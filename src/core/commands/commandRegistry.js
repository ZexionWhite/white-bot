import { z } from "zod";

const commands = new Map();

const aliases = new Map();

export function registerCommand(command) {
  commands.set(command.name, command);

  if (command.aliases && Array.isArray(command.aliases)) {
    for (const alias of command.aliases) {
      aliases.set(alias.toLowerCase(), command.name);
    }
  }
}

export function registerCommands(commandList) {
  for (const cmd of commandList) {
    registerCommand(cmd);
  }
}

export function getCommand(nameOrAlias) {
  const normalized = nameOrAlias.toLowerCase();

  if (commands.has(normalized)) {
    return commands.get(normalized);
  }

  const actualName = aliases.get(normalized);
  if (actualName && commands.has(actualName)) {
    return commands.get(actualName);
  }
  
  return undefined;
}

export function getAllCommands() {
  return Array.from(commands.values());
}

export function hasCommand(nameOrAlias) {
  return getCommand(nameOrAlias) !== undefined;
}

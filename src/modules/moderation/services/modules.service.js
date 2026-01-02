/**
 * Module definitions and command-to-module mapping
 */

export const MODULES = {
  MODERATION: "moderation",
  BLACKLIST: "blacklist",
  INFO: "info",
  CONFIG: "config",
  UTILITIES: "utilities"
};

export const MODULE_NAMES = {
  [MODULES.MODERATION]: "Moderation",
  [MODULES.BLACKLIST]: "Blacklist",
  [MODULES.INFO]: "Information",
  [MODULES.CONFIG]: "Configuration",
  [MODULES.UTILITIES]: "Utilities"
};

/**
 * Maps command keys to their modules
 */
export const COMMAND_TO_MODULE = {
  // Moderation commands
  warn: MODULES.MODERATION,
  mute: MODULES.MODERATION,
  unmute: MODULES.MODERATION,
  timeout: MODULES.MODERATION,
  untimeout: MODULES.MODERATION,
  kick: MODULES.MODERATION,
  ban: MODULES.MODERATION,
  tempban: MODULES.MODERATION,
  softban: MODULES.MODERATION,
  unban: MODULES.MODERATION,
  history: MODULES.MODERATION,
  case: MODULES.MODERATION,
  editcase: MODULES.MODERATION,
  remove: MODULES.MODERATION,
  lock: MODULES.MODERATION,
  unlock: MODULES.MODERATION,
  slowmode: MODULES.MODERATION,
  clear: MODULES.MODERATION,
  
  // Blacklist commands
  "blacklist.add": MODULES.BLACKLIST,
  "blacklist.history": MODULES.BLACKLIST,
  "blacklist.case": MODULES.BLACKLIST,
  "blacklist.edit": MODULES.BLACKLIST,
  "blacklist.remove": MODULES.BLACKLIST,
  
  // Info commands
  user: MODULES.INFO,
  
  // Config commands
  setmodlog: MODULES.CONFIG,
  setblacklistchannel: MODULES.CONFIG,
  createmuterole: MODULES.CONFIG,
  setmuterole: MODULES.CONFIG,
  
  // Utilities (usually don't need permission overrides, but included for completeness)
  help: MODULES.UTILITIES,
  ping: MODULES.UTILITIES,
  config: MODULES.UTILITIES,
  preview: MODULES.UTILITIES
};

/**
 * Gets all commands in a module
 */
export function getModuleCommands(module) {
  return Object.entries(COMMAND_TO_MODULE)
    .filter(([_, mod]) => mod === module)
    .map(([command]) => command);
}

/**
 * Gets the module for a command
 */
export function getCommandModule(commandKey) {
  return COMMAND_TO_MODULE[commandKey] || null;
}

/**
 * Gets all available modules
 */
export function getAllModules() {
  return Object.values(MODULES);
}

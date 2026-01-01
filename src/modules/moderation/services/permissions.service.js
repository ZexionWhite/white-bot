import { PermissionFlagsBits } from "discord.js";
import * as PolicyRepo from "../db/policy.repo.js";
import { getCommandModule } from "./modules.service.js";

const COMMAND_PERMISSIONS = {
  warn: PermissionFlagsBits.ModerateMembers,
  history: PermissionFlagsBits.ModerateMembers,
  case: PermissionFlagsBits.ModerateMembers,
  editcase: PermissionFlagsBits.ModerateMembers,
  remove: PermissionFlagsBits.ModerateMembers,
  timeout: PermissionFlagsBits.ModerateMembers,
  untimeout: PermissionFlagsBits.ModerateMembers,
  mute: PermissionFlagsBits.ManageRoles,
  unmute: PermissionFlagsBits.ManageRoles,
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
  unban: PermissionFlagsBits.BanMembers,
  tempban: PermissionFlagsBits.BanMembers,
  softban: PermissionFlagsBits.BanMembers,
  lock: PermissionFlagsBits.ManageChannels,
  unlock: PermissionFlagsBits.ManageChannels,
  slowmode: PermissionFlagsBits.ManageChannels,
  clear: PermissionFlagsBits.ManageMessages,
  "blacklist.add": PermissionFlagsBits.ModerateMembers,
  "blacklist.history": PermissionFlagsBits.ModerateMembers,
  "blacklist.edit": PermissionFlagsBits.ModerateMembers,
  "blacklist.remove": PermissionFlagsBits.ModerateMembers,
  user: PermissionFlagsBits.ModerateMembers
};

/**
 * Checks if a member can execute a command.
 * First checks for explicit command policies, then module policies, then falls back to Discord permissions.
 */
export async function canExecuteCommand(member, commandKey) {
  if (!member || !member.guild) return false;

  const guild = member.guild;
  const userId = member.id;
  const roles = member.roles.cache;

  // Check for explicit command policies first
  for (const role of roles.values()) {
    const rolePolicy = PolicyRepo.getPolicy.get(guild.id, commandKey, "ROLE", role.id);
    if (rolePolicy) {
      if (rolePolicy.effect === "DENY") return false;
      if (rolePolicy.effect === "ALLOW") return true;
    }
  }

  const userPolicy = PolicyRepo.getPolicy.get(guild.id, commandKey, "USER", userId);
  if (userPolicy) {
    if (userPolicy.effect === "DENY") return false;
    if (userPolicy.effect === "ALLOW") return true;
  }

  // Check for module-level policies
  const module = getCommandModule(commandKey);
  if (module) {
    for (const role of roles.values()) {
      const modulePolicy = PolicyRepo.getPolicy.get(guild.id, module, "ROLE", role.id);
      if (modulePolicy) {
        if (modulePolicy.effect === "DENY") return false;
        if (modulePolicy.effect === "ALLOW") return true;
      }
    }

    const moduleUserPolicy = PolicyRepo.getPolicy.get(guild.id, module, "USER", userId);
    if (moduleUserPolicy) {
      if (moduleUserPolicy.effect === "DENY") return false;
      if (moduleUserPolicy.effect === "ALLOW") return true;
    }
  }

  // Fall back to Discord's native permissions
  const requiredPerm = COMMAND_PERMISSIONS[commandKey];
  if (!requiredPerm) return false;

  return member.permissions.has(requiredPerm);
}

export function canModerate(moderator, target) {
  if (!moderator || !target || !moderator.guild || !target.guild) return false;
  if (moderator.guild.id !== target.guild.id) return false;

  if (target.id === target.guild.ownerId) return false;

  if (moderator.id === target.guild.ownerId) return true;

  if (target.permissions.has(PermissionFlagsBits.Administrator)) {
    return moderator.permissions.has(PermissionFlagsBits.Administrator);
  }

  const modHighest = moderator.roles.highest.position;
  const targetHighest = target.roles.highest.position;

  return modHighest > targetHighest;
}

export function canManageRole(botMember, role) {
  if (!botMember || !role) return false;
  if (botMember.guild.id !== role.guild.id) return false;

  const botHighest = botMember.roles.highest.position;
  const rolePosition = role.position;

  return botHighest > rolePosition && botMember.permissions.has(PermissionFlagsBits.ManageRoles);
}


import { PermissionFlagsBits } from "discord.js";

const djRoles = new Map();

export function setDjRole(guildId, roleId) {
  djRoles.set(guildId, roleId);
}

export function getDjRole(guildId) {
  return djRoles.get(guildId) || null;
}

export function clearDjRole(guildId) {
  djRoles.delete(guildId);
}

export function canControl(member) {
  if (!member || !member.guild) return false;

  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  const djRoleId = getDjRole(member.guild.id);
  if (djRoleId && member.roles.cache.has(djRoleId)) {
    return true;
  }

  return false;
}

export function canSetDjRole(member) {
  if (!member || !member.guild) return false;
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

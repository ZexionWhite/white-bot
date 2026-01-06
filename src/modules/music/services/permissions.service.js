/**
 * Servicio de permisos para música
 * Maneja los permisos del rol DJ y bypass de administradores
 */
import { PermissionFlagsBits } from "discord.js";

// Almacenamiento en memoria: guildId -> djRoleId
const djRoles = new Map();

/**
 * Configura el rol DJ para un guild
 * @param {string} guildId - ID del guild
 * @param {string} roleId - ID del rol DJ
 */
export function setDjRole(guildId, roleId) {
  djRoles.set(guildId, roleId);
}

/**
 * Obtiene el rol DJ de un guild
 * @param {string} guildId - ID del guild
 * @returns {string|null}
 */
export function getDjRole(guildId) {
  return djRoles.get(guildId) || null;
}

/**
 * Elimina el rol DJ de un guild
 * @param {string} guildId - ID del guild
 */
export function clearDjRole(guildId) {
  djRoles.delete(guildId);
}

/**
 * Verifica si un miembro puede usar comandos de control (skip, stop, pause, etc.)
 * @param {import("discord.js").GuildMember} member - Miembro a verificar
 * @returns {boolean}
 */
export function canControl(member) {
  if (!member || !member.guild) return false;

  // Bypass para administradores
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  // Verificar rol DJ
  const djRoleId = getDjRole(member.guild.id);
  if (djRoleId && member.roles.cache.has(djRoleId)) {
    return true;
  }

  return false;
}

/**
 * Verifica si un miembro puede configurar el rol DJ
 * @param {import("discord.js").GuildMember} member - Miembro a verificar
 * @returns {boolean}
 */
export function canSetDjRole(member) {
  if (!member || !member.guild) return false;
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

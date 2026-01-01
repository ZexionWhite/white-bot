import { PermissionFlagsBits } from "discord.js";
import * as CasesService from "./cases.service.js";
import * as DmService from "./dm.service.js";
import * as SettingsRepo from "../db/settings.repo.js";
import { getSettings } from "../../../db.js";

export async function warn(guild, target, moderator, reason) {
  const case_ = CasesService.createCase(
    guild.id,
    "WARN",
    target.id,
    moderator.id,
    reason
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "WARN",
    reason,
    case_.id,
    guild.name,
    null,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function mute(guild, target, moderator, reason, duration = null) {
  const settings = SettingsRepo.getGuildSettings(guild.id);
  if (!settings.mute_role_id) {
    throw new Error("No hay rol de mute configurado. Usa /createmuterole o /setmuterole");
  }

  const muteRole = await guild.roles.fetch(settings.mute_role_id);
  if (!muteRole) {
    throw new Error("El rol de mute configurado no existe");
  }

  const expiresAt = duration ? Date.now() + duration : null;

  await target.roles.add(muteRole, reason || "Mute aplicado");

  const case_ = CasesService.createCase(
    guild.id,
    "MUTE",
    target.id,
    moderator.id,
    reason,
    expiresAt
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "MUTE",
    reason,
    case_.id,
    guild.name,
    duration,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function unmute(guild, target, moderator, reason) {
  const settings = SettingsRepo.getGuildSettings(guild.id);
  if (!settings.mute_role_id) {
    throw new Error("No hay rol de mute configurado");
  }

  const muteRole = await guild.roles.fetch(settings.mute_role_id);
  if (!muteRole) {
    throw new Error("El rol de mute configurado no existe");
  }

  if (!target.roles.cache.has(muteRole.id)) {
    throw new Error("El usuario no está muteado");
  }

  await target.roles.remove(muteRole, reason || "Unmute aplicado");

  const activeCases = CasesService.getActiveCases(guild.id, target.id);
  for (const case_ of activeCases) {
    if (case_.type === "MUTE") {
      CasesService.deactivateCase(guild.id, case_.id);
    }
  }

  const case_ = CasesService.createCase(
    guild.id,
    "UNMUTE",
    target.id,
    moderator.id,
    reason
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "UNMUTE",
    reason,
    case_.id,
    guild.name,
    null,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function timeout(guild, target, moderator, reason, duration) {
  const expiresAt = Date.now() + duration;

  await target.timeout(duration, reason || "Timeout aplicado");

  const case_ = CasesService.createCase(
    guild.id,
    "TIMEOUT",
    target.id,
    moderator.id,
    reason,
    expiresAt
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "TIMEOUT",
    reason,
    case_.id,
    guild.name,
    duration,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function untimeout(guild, target, moderator, reason) {
  if (!target.communicationDisabledUntil) {
    throw new Error("El usuario no está en timeout");
  }

  await target.timeout(null, reason || "Timeout removido");

  const activeCases = CasesService.getActiveCases(guild.id, target.id);
  for (const case_ of activeCases) {
    if (case_.type === "TIMEOUT") {
      CasesService.deactivateCase(guild.id, case_.id);
    }
  }

  const case_ = CasesService.createCase(
    guild.id,
    "UNTIMEOUT",
    target.id,
    moderator.id,
    reason
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "UNTIMEOUT",
    reason,
    case_.id,
    guild.name,
    null,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function kick(guild, target, moderator, reason) {
  await target.kick(reason || "Kick aplicado");

  const case_ = CasesService.createCase(
    guild.id,
    "KICK",
    target.id,
    moderator.id,
    reason
  );

  const dmSent = await DmService.sendPunishmentDM(
    target.user || target,
    "KICK",
    reason,
    case_.id,
    guild.name,
    null,
    case_.created_at
  );

  return { case: case_, dmSent };
}

export async function ban(guild, targetId, moderator, reason, deleteDays = 0) {
  await guild.bans.create(targetId, {
    reason: reason || "Ban aplicado",
    deleteMessageSeconds: deleteDays * 24 * 60 * 60
  });

  const case_ = CasesService.createCase(
    guild.id,
    "BAN",
    targetId,
    moderator.id,
    reason
  );

  return { case: case_ };
}

export async function tempban(guild, targetId, moderator, reason, duration) {
  const expiresAt = Date.now() + duration;

  await guild.bans.create(targetId, {
    reason: reason || "Tempban aplicado",
    deleteMessageSeconds: 0
  });

  const case_ = CasesService.createCase(
    guild.id,
    "TEMPBAN",
    targetId,
    moderator.id,
    reason,
    expiresAt
  );

  // Try to send DM (user might not be in server, so might fail)
  try {
    const target = await guild.client.users.fetch(targetId);
    await DmService.sendPunishmentDM(
      target,
      "TEMPBAN",
      reason,
      case_.id,
      guild.name,
      duration,
      case_.created_at
    );
  } catch (error) {
    // User not found or DMs disabled, ignore
  }

  return { case: case_ };
}

export async function softban(guild, targetId, moderator, reason, deleteDays = 1) {
  await guild.bans.create(targetId, {
    reason: reason || "Softban aplicado",
    deleteMessageSeconds: deleteDays * 24 * 60 * 60
  });

  await guild.bans.remove(targetId, "Softban: unban automático");

  const case_ = CasesService.createCase(
    guild.id,
    "SOFTBAN",
    targetId,
    moderator.id,
    reason
  );

  return { case: case_ };
}

export async function unban(guild, targetId, moderator, reason) {
  await guild.bans.remove(targetId, reason || "Unban aplicado");

  const activeCases = CasesService.getActiveCases(guild.id, targetId);
  for (const case_ of activeCases) {
    if (case_.type === "BAN" || case_.type === "TEMPBAN") {
      CasesService.deactivateCase(guild.id, case_.id);
    }
  }

  const case_ = CasesService.createCase(
    guild.id,
    "UNBAN",
    targetId,
    moderator.id,
    reason
  );

  return { case: case_ };
}


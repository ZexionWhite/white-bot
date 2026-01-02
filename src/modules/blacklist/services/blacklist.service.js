import * as BlacklistRepo from "../db/blacklist.repo.js";
import * as CasesService from "../../moderation/services/cases.service.js";

export async function createEntry(guildId, userId, moderatorId, reason, evidence = null, severity = "MEDIUM") {
  const now = Date.now();
  // Evidence ya no se guarda en DB (se maneja como archivo adjunto en Discord CDN)
  const result = await BlacklistRepo.createBlacklistEntry.run(
    guildId,
    userId,
    moderatorId,
    reason || "Sin razón especificada",
    null, // evidence ya no se guarda en DB
    severity,
    now
  );

  return {
    id: result.lastInsertRowid,
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason || "Sin razón especificada",
    evidence: null, // Ya no se guarda en DB
    severity,
    created_at: now
  };
}

export async function getEntry(guildId, entryId) {
  return await BlacklistRepo.getBlacklistEntry.get(entryId, guildId);
}

export async function getUserEntries(guildId, userId) {
  return await BlacklistRepo.getBlacklistByUser.all(guildId, userId);
}

export async function updateEntry(guildId, entryId, updatedBy, newReason, newEvidence = null, newSeverity = null) {
  // Validaciones de seguridad
  const current = await getEntry(guildId, entryId);
  if (!current) return null;

  // Evidence ya no se guarda en DB (se maneja como archivo adjunto en Discord CDN)
  await BlacklistRepo.updateBlacklistEntry.run(
    newReason || current.reason,
    null, // evidence ya no se guarda en DB
    newSeverity || current.severity,
    Date.now(),
    updatedBy,
    entryId,
    guildId
  );

  return await getEntry(guildId, entryId);
}

export async function deleteEntry(guildId, entryId, deletedBy, reason) {
  await BlacklistRepo.deleteBlacklistEntry.run(
    Date.now(),
    deletedBy,
    reason || "Sin razón especificada",
    entryId,
    guildId
  );
}


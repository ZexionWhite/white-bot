import * as BlacklistRepo from "../db/blacklist.repo.js";
import * as CasesService from "../../moderation/services/cases.service.js";

export async function createEntry(guildId, userId, moderatorId, reason, evidence = null, severity = "MEDIUM") {
  const now = Date.now();
  
  const result = await BlacklistRepo.createBlacklistEntry.run(
    guildId,
    userId,
    moderatorId,
    reason || "Sin razón especificada",
    null, 
    severity,
    now
  );

  return {
    id: result.lastInsertRowid,
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason || "Sin razón especificada",
    evidence: null, 
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
  
  const current = await getEntry(guildId, entryId);
  if (!current) return null;

  await BlacklistRepo.updateBlacklistEntry.run(
    newReason || current.reason,
    null, 
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

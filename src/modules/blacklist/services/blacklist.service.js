import * as BlacklistRepo from "../db/blacklist.repo.js";
import * as CasesService from "../../moderation/services/cases.service.js";

export function createEntry(guildId, userId, moderatorId, reason, evidence = null, severity = "MEDIUM") {
  const now = Date.now();
  const result = BlacklistRepo.createBlacklistEntry.run(
    guildId,
    userId,
    moderatorId,
    reason || "Sin razón especificada",
    evidence,
    severity,
    now
  );

  return {
    id: result.lastInsertRowid,
    guild_id: guildId,
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason || "Sin razón especificada",
    evidence,
    severity,
    created_at: now
  };
}

export function getEntry(guildId, entryId) {
  return BlacklistRepo.getBlacklistEntry.get(entryId, guildId);
}

export function getUserEntries(guildId, userId) {
  return BlacklistRepo.getBlacklistByUser.all(guildId, userId);
}

export function updateEntry(guildId, entryId, updatedBy, newReason, newEvidence = null, newSeverity = null) {
  const current = getEntry(guildId, entryId);
  if (!current) return null;

  BlacklistRepo.updateBlacklistEntry.run(
    newReason || current.reason,
    newEvidence !== null ? newEvidence : current.evidence,
    newSeverity || current.severity,
    Date.now(),
    updatedBy,
    entryId,
    guildId
  );

  return getEntry(guildId, entryId);
}

export function deleteEntry(guildId, entryId, deletedBy, reason) {
  BlacklistRepo.deleteBlacklistEntry.run(
    Date.now(),
    deletedBy,
    reason || "Sin razón especificada",
    entryId,
    guildId
  );
}


import * as CasesRepo from "../db/cases.repo.js";

export function createCase(guildId, type, targetId, moderatorId, reason, expiresAt = null, metadata = null) {
  const now = Date.now();
  const metadataStr = metadata ? JSON.stringify(metadata) : null;

  const result = CasesRepo.createCase.run(
    guildId,
    type,
    targetId,
    moderatorId,
    reason || "Sin razón especificada",
    now,
    expiresAt,
    1,
    metadataStr
  );

  return {
    id: result.lastInsertRowid,
    guild_id: guildId,
    type,
    target_id: targetId,
    moderator_id: moderatorId,
    reason: reason || "Sin razón especificada",
    created_at: now,
    expires_at: expiresAt,
    active: 1,
    metadata: metadataStr
  };
}

export function getCase(guildId, caseId) {
  return CasesRepo.getCaseById.get(caseId, guildId);
}

export function getUserCases(guildId, userId, type = null, limit = 10, offset = 0) {
  if (type) {
    return CasesRepo.getCasesByType.all(guildId, userId, type, limit, offset);
  }
  return CasesRepo.getCasesByUser.all(guildId, userId, limit, offset);
}

export function getActiveCases(guildId, userId) {
  return CasesRepo.getActiveCases.all(guildId, userId);
}

export function updateCase(guildId, caseId, newReason, metadata = null) {
  const metadataStr = metadata ? JSON.stringify(metadata) : null;
  CasesRepo.updateCase.run(newReason, metadataStr, caseId, guildId);
  return getCase(guildId, caseId);
}

export function deleteCase(guildId, caseId, deletedBy, reason) {
  CasesRepo.deleteCase.run(Date.now(), deletedBy, reason, caseId, guildId);
}

export function deactivateCase(guildId, caseId) {
  CasesRepo.deactivateCase.run(caseId, guildId);
}

export function countUserCases(guildId, userId) {
  const result = CasesRepo.countCasesByUser.get(guildId, userId);
  return result?.count || 0;
}

export function getActiveTempbans(guildId) {
  // Returns tempbans that haven't expired yet (expires_at > now)
  const now = Date.now();
  const allTempbans = CasesRepo.getActiveTempbans.all(guildId, now + 1); // Add 1ms to get non-expired ones
  return allTempbans.filter(c => c.expires_at && c.expires_at > now);
}


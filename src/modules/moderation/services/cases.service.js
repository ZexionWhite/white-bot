import * as CasesRepo from "../db/cases.repo.js";

export async function createCase(guildId, type, targetId, moderatorId, reason, expiresAt = null, metadata = null) {
  const now = Date.now();
  const metadataStr = metadata ? JSON.stringify(metadata) : null;

  const result = await CasesRepo.createCase.run(
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

export async function getCase(guildId, caseId) {
  return await CasesRepo.getCaseById.get(caseId, guildId);
}

export async function getUserCases(guildId, userId, type = null, limit = 10, offset = 0) {
  if (type) {
    return await CasesRepo.getCasesByType.all(guildId, userId, type, limit, offset);
  }
  return await CasesRepo.getCasesByUser.all(guildId, userId, limit, offset);
}

export async function getActiveCases(guildId, userId) {
  return await CasesRepo.getActiveCases.all(guildId, userId);
}

export async function updateCase(guildId, caseId, newReason, metadata = null) {
  const metadataStr = metadata ? JSON.stringify(metadata) : null;
  await CasesRepo.updateCase.run(newReason, metadataStr, caseId, guildId);
  return await getCase(guildId, caseId);
}

export async function deleteCase(guildId, caseId, deletedBy, reason) {
  await CasesRepo.deleteCase.run(Date.now(), deletedBy, reason, caseId, guildId);
}

export async function deactivateCase(guildId, caseId) {
  await CasesRepo.deactivateCase.run(caseId, guildId);
}

export async function countUserCases(guildId, userId) {
  const result = await CasesRepo.countCasesByUser.get(guildId, userId);
  return result?.count || 0;
}

export async function getActiveTempbans(guildId) {
  // Returns tempbans that haven't expired yet (expires_at > now)
  const now = Date.now();
  const allTempbans = await CasesRepo.getActiveTempbans.all(guildId, now + 1); // Add 1ms to get non-expired ones
  return allTempbans.filter(c => c.expires_at && c.expires_at > now);
}


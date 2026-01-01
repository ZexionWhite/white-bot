import * as CasesService from "../../moderation/services/cases.service.js";
import * as VoiceRepo from "../../moderation/db/voice.repo.js";
import * as MessagesRepo from "../../moderation/db/messages.repo.js";
import * as PolicyRepo from "../../moderation/db/policy.repo.js";
import * as TrustScoreService from "../../moderation/services/trustscore.service.js";
import { formatDuration } from "../../../utils/time.js";

// Esta función ya no se usa, pero la mantenemos por compatibilidad
export function getUserOverview(member, guild) {
  const highestRole = member.roles.highest;
  const highestRoleDisplay = highestRole && highestRole.id !== guild.id 
    ? highestRole.toString() 
    : "None";

  return {
    highestRole: highestRoleDisplay
  };
}

export function getUserSanctions(guildId, userId) {
  const allCases = CasesService.getUserCases(guildId, userId, null, 10, 0);
  // Filtrar casos de blacklist - la blacklist es un sistema separado
  return allCases.filter(c => c.type !== "BLACKLIST");
}

export function getUserVoiceActivity(guildId, userId) {
  return VoiceRepo.getVoiceActivity.all(guildId, userId, 5);
}

export function getUserMessages(guildId, userId) {
  return MessagesRepo.getMessages.all(guildId, userId, 5);
}

export function getUserPermissions(guildId, userId, member) {
  const userPolicies = [];
  const rolePolicies = [];

  for (const role of member.roles.cache.values()) {
    const policies = PolicyRepo.getPoliciesBySubject.all(guildId, "ROLE", role.id);
    rolePolicies.push(...policies);
  }

  const userPoliciesList = PolicyRepo.getPoliciesBySubject.all(guildId, "USER", userId);
  userPolicies.push(...userPoliciesList);

  return { userPolicies, rolePolicies };
}

export function getUserTrustScore(guildId, userId) {
  return TrustScoreService.calculateTrustScore(guildId, userId);
}


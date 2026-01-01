import * as CasesRepo from "../db/cases.repo.js";

const WEIGHTS = {
  WARN: 5,
  MUTE: 10,
  TIMEOUT: 15,
  KICK: 20,
  TEMPBAN: 25,
  BAN: 30,
  SOFTBAN: 20
};

const DECAY_DAYS = 30;

export function calculateTrustScore(guildId, userId) {
  const cases = CasesRepo.getCasesByUser.all(guildId, userId, 100, 0);
  const now = Date.now();
  const decayMs = DECAY_DAYS * 24 * 60 * 60 * 1000;

  let score = 100;

  for (const case_ of cases) {
    if (case_.deleted_at) continue;

    const age = now - case_.created_at;
    if (age > decayMs) continue;

    const weight = WEIGHTS[case_.type] || 0;
    const decayFactor = 1 - (age / decayMs);
    score -= weight * decayFactor;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}


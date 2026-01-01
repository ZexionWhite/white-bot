/**
 * Creates a simple text message for sanction confirmation
 * Format: ✅ Case #46 @user has been warned.
 */
export function createSanctionMessage(action, target, caseId) {
  const actionNames = {
    warn: "warned",
    mute: "muted",
    unmute: "unmuted",
    timeout: "timed out",
    untimeout: "timeout removed from",
    kick: "kicked",
    ban: "banned",
    tempban: "temporarily banned",
    softban: "softbanned",
    unban: "unbanned"
  };

  const actionLower = typeof action === "string" ? action.toLowerCase() : "";
  const actionPast = actionNames[actionLower] || "sanctioned";
  
  const userMention = `<@${target.id}>`;
  
  return `✅ Case #${caseId} ${userMention} has been ${actionPast}.`;
}

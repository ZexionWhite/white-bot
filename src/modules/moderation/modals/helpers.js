import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { prepare } from "../../../core/db/index.js";

/**
 * Creates a pending action in the database and returns its ID
 */
export async function createPendingAction(guildId, authorId, command, payload) {
  const now = Date.now();
  const payloadJson = JSON.stringify(payload);
  
  const stmt = prepare(`
    INSERT INTO pending_actions (guild_id, author_id, command, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = await stmt.run(guildId, authorId, command, payloadJson, now);
  return result.lastInsertRowid;
}

/**
 * Gets a pending action by ID
 */
export async function getPendingAction(actionId) {
  const stmt = prepare(`
    SELECT * FROM pending_actions WHERE id = ?
  `);
  
  const row = await stmt.get(actionId);
  if (!row) return null;
  
  return {
    ...row,
    payload: JSON.parse(row.payload_json)
  };
}

/**
 * Deletes a pending action
 */
export async function deletePendingAction(actionId) {
  const stmt = prepare(`
    DELETE FROM pending_actions WHERE id = ?
  `);
  
  await stmt.run(actionId);
}

/**
 * Cleans up old pending actions (older than 1 hour)
 */
export async function cleanupOldPendingActions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const stmt = prepare(`
    DELETE FROM pending_actions WHERE created_at < ?
  `);
  
  const result = await stmt.run(oneHourAgo);
  return result.changes;
}

/**
 * Creates a reason modal
 */
export function createReasonModal(command, title, customId, placeholder = "Explain briefly what happened...") {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder(placeholder)
    .setMinLength(3)
    .setMaxLength(1000);

  const actionRow = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(actionRow);

  return modal;
}

/**
 * Creates a blacklist modal with reason and evidence
 */
export function createBlacklistModal(customId, isEdit = false) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(isEdit ? "Blacklist: Edit Entry" : "Blacklist: Add Entry");

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Reason")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("Explain why this user is being blacklisted...")
    .setMinLength(3)
    .setMaxLength(1000);

  const evidenceInput = new TextInputBuilder()
    .setCustomId("evidence")
    .setLabel("Evidence (Optional)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder("Links, message IDs, or other evidence...")
    .setMaxLength(1000);

  const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
  const evidenceRow = new ActionRowBuilder().addComponents(evidenceInput);
  
  modal.addComponents(reasonRow, evidenceRow);

  return modal;
}

/**
 * Creates an edit case modal
 */
export function createEditCaseModal(customId) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle("Edit Case: New Reason");

  const reasonInput = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("New Reason")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("Enter the new reason for this case...")
    .setMinLength(3)
    .setMaxLength(1000);

  const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
  modal.addComponents(reasonRow);

  return modal;
}

/**
 * Validates reason from modal
 */
export function validateReason(reason) {
  if (!reason || typeof reason !== "string") {
    return { valid: false, error: "Reason is required" };
  }
  
  const trimmed = reason.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: "Reason must be at least 3 characters" };
  }
  
  if (trimmed.length > 1000) {
    return { valid: false, error: "Reason must be less than 1000 characters" };
  }
  
  return { valid: true, reason: trimmed };
}

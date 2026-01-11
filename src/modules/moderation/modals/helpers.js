import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { prepare } from "../../../core/db/index.js";

export async function createPendingAction(guildId, authorId, command, payload) {
  const now = Date.now();
  const payloadJson = JSON.stringify(payload);
  
  const stmt = prepare(`
    INSERT INTO pending_actions (guild_id, author_id, command, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id
  `);
  
  const result = await stmt.run(guildId, authorId, command, payloadJson, now);
  return result.lastInsertRowid;
}

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

export async function deletePendingAction(actionId) {
  const stmt = prepare(`
    DELETE FROM pending_actions WHERE id = ?
  `);
  
  await stmt.run(actionId);
}

export async function cleanupOldPendingActions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const stmt = prepare(`
    DELETE FROM pending_actions WHERE created_at < ?
  `);
  
  const result = await stmt.run(oneHourAgo);
  return result.changes;
}

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

  const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
  
  modal.addComponents(reasonRow);

  return modal;
}

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

/**
 * Componentes de UI para el módulo de música
 * Botones opcionales para control de reproducción
 * (Preparados pero no obligatorios en MVP)
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Crea botones de control de reproducción
 * @param {boolean} isPaused - Si está pausado
 * @returns {ActionRowBuilder}
 */
export function createPlayerControls(isPaused = false) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("music:pause")
        .setLabel(isPaused ? "Resume" : "Pause")
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
        .setEmoji(isPaused ? "▶️" : "⏸️"),
      new ButtonBuilder()
        .setCustomId("music:skip")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("music:stop")
        .setLabel("Stop")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️"),
      new ButtonBuilder()
        .setCustomId("music:queue")
        .setLabel("Queue")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📋")
    );

  return row;
}

/**
 * Crea botones de loop
 * @param {string} loopMode - Modo de loop (off, track, queue)
 * @returns {ActionRowBuilder}
 */
export function createLoopControls(loopMode = "off") {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("music:loop:off")
        .setLabel("Loop Off")
        .setStyle(loopMode === "off" ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji("🔁"),
      new ButtonBuilder()
        .setCustomId("music:loop:track")
        .setLabel("Loop Track")
        .setStyle(loopMode === "track" ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji("🔂"),
      new ButtonBuilder()
        .setCustomId("music:loop:queue")
        .setLabel("Loop Queue")
        .setStyle(loopMode === "queue" ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji("🔁")
    );

  return row;
}

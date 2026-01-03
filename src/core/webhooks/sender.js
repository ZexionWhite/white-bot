/**
 * Sistema de envío de logs mediante webhooks con fallback seguro
 */
import { WebhookClient } from "discord.js";
import { getOrCreateWebhook, invalidateWebhookCache, hasWebhookPermissions } from "./manager.js";
import { log } from "../logger/index.js";

/**
 * Envía un log mediante webhook con fallback a channel.send()
 * @param {import("discord.js").GuildTextBasedChannel} channel - Canal donde enviar el log
 * @param {import("discord.js").MessageCreateOptions} options - Opciones del mensaje (content, embeds, etc.)
 * @param {string} type - Tipo de log (moderation, blacklist, message, voice, user, join)
 * @returns {Promise<boolean>} true si se envió correctamente, false en caso contrario
 */
export async function sendLog(channel, options, type = "moderation") {
  if (!channel?.isTextBased() || channel.isDMBased()) {
    return false;
  }

  // Verificar permisos básicos
  if (!channel.permissionsFor(channel.guild.members.me)?.has("SendMessages")) {
    log.warn("Webhooks", `Sin permisos para enviar en canal ${channel.name}`);
    return false;
  }

  // Intentar usar webhook
  try {
    const hasPerms = await hasWebhookPermissions(channel);
    if (hasPerms) {
      const webhookData = await getOrCreateWebhook(channel, type);
      if (webhookData) {
        try {
          const webhookClient = new WebhookClient({
            id: webhookData.id,
            token: webhookData.token,
          });

          await webhookClient.send({
            content: options.content || undefined,
            embeds: options.embeds || [],
            files: options.files || [],
            username: undefined, // Usar nombre por defecto del webhook
            avatarURL: undefined, // Usar avatar por defecto del webhook
          });

          return true;
        } catch (error) {
          // Error al enviar con webhook: puede ser que fue eliminado
          if (error.code === 10015 || error.message.includes("Unknown Webhook")) {
            log.warn("Webhooks", `Webhook eliminado para canal ${channel.name}, invalidando cache`);
            await invalidateWebhookCache(channel.id);
          } else {
            log.debug("Webhooks", `Error al enviar con webhook: ${error.message}`);
          }
          // Continuar al fallback
        }
      }
    }
  } catch (error) {
    log.debug("Webhooks", `Error en sistema de webhooks, usando fallback: ${error.message}`);
    // Continuar al fallback
  }

  // Fallback seguro a channel.send()
  try {
    await channel.send(options);
    return true;
  } catch (error) {
    log.error("Webhooks", `Error al enviar log (fallback): ${error.message}`);
    return false;
  }
}

/**
 * Envía múltiples logs (útil para batching futuro)
 * @param {import("discord.js").GuildTextBasedChannel} channel
 * @param {import("discord.js").MessageCreateOptions[]} messages
 * @param {string} type
 * @returns {Promise<number>} Número de mensajes enviados exitosamente
 */
export async function sendLogs(channel, messages, type = "moderation") {
  let successCount = 0;
  for (const msg of messages) {
    const success = await sendLog(channel, msg, type);
    if (success) successCount++;
  }
  return successCount;
}

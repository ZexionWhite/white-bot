import { WebhookClient } from "discord.js";
import { getOrCreateWebhook, invalidateWebhookCache, hasWebhookPermissions } from "./manager.js";
import { log } from "../logger/index.js";

export async function sendLog(channel, options, type = "moderation") {
  if (!channel?.isTextBased() || channel.isDMBased()) {
    return false;
  }

  if (!channel.permissionsFor(channel.guild.members.me)?.has("SendMessages")) {
    log.warn("Webhooks", `Sin permisos para enviar en canal ${channel.name}`);
    return false;
  }

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
            username: undefined, 
            avatarURL: undefined, 
          });

          return true;
        } catch (error) {
          
          if (error.code === 10015 || error.message.includes("Unknown Webhook")) {
            log.warn("Webhooks", `Webhook eliminado para canal ${channel.name}, invalidando cache`);
            await invalidateWebhookCache(channel.id);
          } else {
            log.debug("Webhooks", `Error al enviar con webhook: ${error.message}`);
          }
          
        }
      }
    }
  } catch (error) {
    log.debug("Webhooks", `Error en sistema de webhooks, usando fallback: ${error.message}`);
    
  }

  try {
    await channel.send(options);
    return true;
  } catch (error) {
    log.error("Webhooks", `Error al enviar log (fallback): ${error.message}`);
    return false;
  }
}

export async function sendLogs(channel, messages, type = "moderation") {
  let successCount = 0;
  for (const msg of messages) {
    const success = await sendLog(channel, msg, type);
    if (success) successCount++;
  }
  return successCount;
}

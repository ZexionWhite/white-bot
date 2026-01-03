/**
 * Módulo Webhooks - Exportaciones principales
 */
export { getOrCreateWebhook, invalidateWebhookCache, hasWebhookPermissions, WEBHOOK_CONFIGS } from "./manager.js";
export { sendLog, sendLogs } from "./sender.js";

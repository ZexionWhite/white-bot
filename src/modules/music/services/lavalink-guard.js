/**
 * Guard helper para verificar disponibilidad de Lavalink
 * Usado por comandos de música para verificar estado antes de ejecutar
 */
import { isLavalinkReady, getNodeStatus } from "./lavalink.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { t } from "../../../core/i18n/index.js";

/**
 * Verifica si Lavalink está disponible y retorna error embed si no lo está
 * @param {string} locale - Locale del usuario
 * @returns {{available: boolean, errorEmbed?: EmbedBuilder}}
 */
export function checkLavalinkAvailability(locale) {
  const ready = isLavalinkReady();
  
  if (ready) {
    return { available: true };
  }

  const status = getNodeStatus();
  let errorKey = "music.errors.lavalink_unavailable";
  
  if (status?.lastError?.errorType === "AUTH_FAILED") {
    errorKey = "music.errors.lavalink_auth_failed";
  } else if (status?.lastError?.errorType === "DNS_FAILED") {
    errorKey = "music.errors.lavalink_dns_failed";
  }
  
  // Log de depuración (solo en desarrollo, se puede remover después)
  if (process.env.NODE_ENV !== "production") {
    console.log("[Lavalink Guard] Estado:", {
      ready,
      state: status?.state,
      nodeConnected: status?.node?.connected,
      hasNodeManager: !!status?.node,
      lastError: status?.lastError
    });
  }
  
  return {
    available: false,
    errorEmbed: createErrorEmbed(t(locale, errorKey))
  };
}

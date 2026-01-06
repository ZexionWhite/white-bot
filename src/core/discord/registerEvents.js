/**
 * Registra todos los eventos del cliente Discord
 */
import ready from "../../events/ready.js";
import guildMemberAdd from "../../events/guildMemberAdd.js";
import interactionCreate from "../../events/interactionCreate.js";
import guildMemberUpdate from "../../events/guildMemberUpdate.js";
import guildMemberRemove from "../../events/guildMemberRemove.js";
import messageCreate from "../../events/messageCreate.js";
import messageDelete from "../../events/messageDelete.js";
import messageUpdate from "../../events/messageUpdate.js";
import userUpdate from "../../events/userUpdate.js";
import voiceStateUpdate from "../../events/voiceStateUpdate.js";
import { startApiTracker } from "../../utils/apiTracker.js";
import { log } from "../logger/index.js";

/**
 * Registra todos los eventos del cliente
 * @param {import("discord.js").Client} client - Cliente de Discord
 */
export function registerEvents(client) {
  // Ready event (una sola vez)
  client.once("ready", async () => {
    startApiTracker(client);
    await ready(client);
  });

  // Eventos de guild members
  client.on("guildMemberAdd", (m) => guildMemberAdd(client, m));
  client.on("guildMemberUpdate", (oldM, newM) => guildMemberUpdate(client, oldM, newM));
  client.on("guildMemberRemove", (m) => guildMemberRemove(client, m));

  // Eventos de interacciones
  client.on("interactionCreate", (i) => interactionCreate(client, i));

  // Eventos de mensajes
  client.on("messageCreate", (m) => messageCreate(client, m));
  client.on("messageDelete", (m) => messageDelete(client, m));
  client.on("messageUpdate", (oldM, newM) => messageUpdate(client, oldM, newM));

  // Eventos de usuario
  client.on("userUpdate", (oldU, newU) => userUpdate(client, oldU, newU));

  // Eventos de voz
  client.on("voiceStateUpdate", (oldState, newState) => voiceStateUpdate(client, oldState, newState));

  // Eventos raw para Lavalink
  client.on("raw", async (data) => {
    try {
      const { getLavalinkClient } = await import("../../modules/music/services/lavalink.service.js");
      const lavalink = getLavalinkClient();
      if (lavalink && typeof lavalink.sendRawData === "function") {
        try {
          lavalink.sendRawData(data);
        } catch (error) {
          // Error al enviar raw data - NO crashear, solo loggear
          log.debug("Lavalink", "Error enviando raw data:", error.message);
        }
      }
    } catch (error) {
      // Ignorar si Lavalink no está inicializado o hay cualquier error
      // NO hacer throw - permitir que el bot continúe
    }
  });

  // Errores y advertencias del cliente
  client.on("error", (error) => {
    log.error("Client", "Error del cliente Discord:", error.message);
    console.error("[Client] Error completo:", error);
    if (error.stack) {
      console.error("[Client] Stack trace:", error.stack);
    }
  });

  client.on("warn", (warning) => {
    log.warn("Client", "Advertencia del cliente Discord:", warning);
  });
}

/**
 * Registra handlers de proceso (unhandledRejection, uncaughtException)
 * NO debe crashear el bot por errores de Lavalink o errores no críticos
 */
export function registerProcessHandlers(client) {
  process.on("unhandledRejection", (reason, promise) => {
    const errorMsg = reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : undefined;
    
    log.error("Process", "Unhandled Rejection:", {
      reason: errorMsg,
      stack: errorStack,
      promise: promise
    });
    
    // NO hacer exit - permitir que el bot continúe
    // Errores de Lavalink NO son críticos
    if (errorMsg.includes("Lavalink") || errorMsg.includes("ERR_UNHANDLED_ERROR") || errorMsg.includes("WebSocket")) {
      log.warn("Process", "Error relacionado con Lavalink capturado. El bot continuará sin funcionalidad de música.");
      return;
    }
  });

  process.on("uncaughtException", (error) => {
    log.error("Process", "Uncaught Exception:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Solo hacer exit si es un error crítico del sistema
    // Errores de Lavalink/WebSocket NO son críticos
    if (error.message?.includes("Lavalink") || 
        error.message?.includes("ERR_UNHANDLED_ERROR") || 
        error.message?.includes("WebSocket") ||
        error.code === "ERR_UNHANDLED_ERROR") {
      log.warn("Process", "Error relacionado con Lavalink capturado. El bot continuará sin funcionalidad de música.");
      return; // NO hacer exit
    }
    
    // Para errores críticos del sistema (out of memory, etc.), hacer exit
    // Pero la mayoría de errores de aplicación pueden ser manejados
    log.error("Process", "Error crítico detectado. Verifica logs para más detalles.");
    // NO hacer exit automáticamente - permitir recuperación
  });
}

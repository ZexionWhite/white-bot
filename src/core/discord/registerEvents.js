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

export function registerEvents(client) {
  
  client.once("ready", async () => {
    startApiTracker(client);
    await ready(client);
  });

  client.on("guildMemberAdd", (m) => guildMemberAdd(client, m));
  client.on("guildMemberUpdate", (oldM, newM) => guildMemberUpdate(client, oldM, newM));
  client.on("guildMemberRemove", (m) => guildMemberRemove(client, m));

  client.on("interactionCreate", (i) => interactionCreate(client, i));

  client.on("messageCreate", (m) => messageCreate(client, m));
  client.on("messageDelete", (m) => messageDelete(client, m));
  client.on("messageUpdate", (oldM, newM) => messageUpdate(client, oldM, newM));

  client.on("userUpdate", (oldU, newU) => userUpdate(client, oldU, newU));

  client.on("voiceStateUpdate", (oldState, newState) => voiceStateUpdate(client, oldState, newState));

  let lavalinkServicePromise = null;
  client.on("raw", (packet) => {
    
    if (!lavalinkServicePromise) {
      lavalinkServicePromise = import("../../modules/music/services/lavalink.service.js").catch(() => null);
    }

    lavalinkServicePromise.then((module) => {
      if (!module) return;
      const lavalink = module.getLavalinkClient();
      if (lavalink && typeof lavalink.sendRawData === "function") {
        try {
          lavalink.sendRawData(packet);
        } catch (error) {
          
          log.debug("Lavalink", "Error enviando raw data:", error.message);
        }
      }
    }).catch(() => {
      
    });
  });

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

export function registerProcessHandlers(client) {
  
  process.on("unhandledRejection", (reason, promise) => {
    const errorMsg = reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : undefined;
    
    log.error("Process", "Unhandled Rejection:", {
      reason: errorMsg,
      stack: errorStack,
      promise: promise
    });

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

    if (error.message?.includes("Lavalink") || 
        error.message?.includes("ERR_UNHANDLED_ERROR") || 
        error.message?.includes("WebSocket") ||
        error.code === "ERR_UNHANDLED_ERROR") {
      log.warn("Process", "Error relacionado con Lavalink capturado. El bot continuará sin funcionalidad de música.");
      return; 
    }

    log.error("Process", "Error crítico detectado. Verifica logs para más detalles.");
    
  });

  process.on("SIGTERM", () => {
    log.warn("Process", "⚠️ SIGTERM recibida - Cerrando gracefully...");

  });

  process.on("SIGINT", () => {
    log.warn("Process", "⚠️ SIGINT recibida (Ctrl+C) - Cerrando gracefully...");
    
  });
}

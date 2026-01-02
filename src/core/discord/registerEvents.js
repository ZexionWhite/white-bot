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
  client.once("ready", () => {
    startApiTracker(client);
    ready(client);
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

  // Errores y advertencias del cliente
  client.on("error", (error) => {
    log.error("Client", "Error del cliente Discord:", error.message);
  });

  client.on("warn", (warning) => {
    log.warn("Client", "Advertencia del cliente Discord:", warning);
  });
}

/**
 * Registra handlers de proceso (unhandledRejection, uncaughtException)
 */
export function registerProcessHandlers(client) {
  process.on("unhandledRejection", (reason, promise) => {
    log.error("Process", "Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    log.error("Process", "Uncaught Exception:", error);
    process.exit(1);
  });
}

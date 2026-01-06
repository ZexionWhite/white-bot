/**
 * Servicio de conexión a Lavalink
 * Maneja la conexión y gestión de nodos de Lavalink
 */
import { Client } from "lavalink-client";
import { log } from "../../../core/logger/index.js";
import { getEnv } from "../../../core/config/index.js";

let lavalinkClient = null;

/**
 * Inicializa el cliente de Lavalink
 * @param {import("discord.js").Client} discordClient - Cliente de Discord
 */
export function initializeLavalink(discordClient) {
  if (lavalinkClient) {
    log.warn("Lavalink", "Cliente ya inicializado");
    return lavalinkClient;
  }

  const host = getEnv("LAVALINK_HOST", "localhost");
  const port = parseInt(getEnv("LAVALINK_PORT", "2333"), 10);
  const password = getEnv("LAVALINK_PASSWORD", "youshallnotpass");
  const secure = getEnv("LAVALINK_SECURE", "false").toLowerCase() === "true";

  lavalinkClient = new Client({
    nodes: [
      {
        host,
        port,
        password,
        secure
      }
    ],
    send: (guildId, payload) => {
      const guild = discordClient.guilds.cache.get(guildId);
      if (guild) {
        guild.shard.send(payload);
      }
    }
  });

  // Eventos de conexión
  lavalinkClient.on("nodeConnect", (node) => {
    log.info("Lavalink", `Nodo conectado: ${node.id}`);
  });

  lavalinkClient.on("nodeDisconnect", (node, reason) => {
    log.warn("Lavalink", `Nodo desconectado: ${node.id} - ${reason}`);
  });

  lavalinkClient.on("nodeError", (node, error) => {
    log.error("Lavalink", `Error en nodo ${node.id}:`, error);
  });

  // Conectar
  lavalinkClient.connect(discordClient.user.id);

  log.info("Lavalink", `Cliente inicializado - Host: ${host}:${port}, Secure: ${secure}`);

  return lavalinkClient;
}

/**
 * Obtiene el cliente de Lavalink
 * @returns {Client|null}
 */
export function getLavalinkClient() {
  return lavalinkClient;
}

/**
 * Verifica si el cliente está conectado
 * @returns {boolean}
 */
export function isConnected() {
  return lavalinkClient !== null && lavalinkClient.nodes.size > 0;
}

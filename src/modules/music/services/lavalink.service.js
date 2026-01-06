/**
 * Servicio de conexión a Lavalink
 * Maneja la conexión y gestión de nodos de Lavalink
 */
import { LavalinkManager } from "lavalink-client";
import { log } from "../../../core/logger/index.js";
import { getEnv } from "../../../core/config/index.js";

let lavalinkManager = null;

/**
 * Inicializa el cliente de Lavalink
 * @param {import("discord.js").Client} discordClient - Cliente de Discord
 */
export function initializeLavalink(discordClient) {
  if (lavalinkManager) {
    log.warn("Lavalink", "Cliente ya inicializado");
    return lavalinkManager;
  }

  const host = process.env.LAVALINK_HOST || "localhost";
  const port = parseInt(process.env.LAVALINK_PORT || "2333", 10);
  const password = process.env.LAVALINK_PASSWORD || "youshallnotpass";
  const secure = (process.env.LAVALINK_SECURE || "false").toLowerCase() === "true";

  log.info("Lavalink", `Configurando conexión a Lavalink...`);
  log.info("Lavalink", `  Host: ${host}`);
  log.info("Lavalink", `  Port: ${port}`);
  log.info("Lavalink", `  Secure: ${secure}`);
  log.info("Lavalink", `  Password: ${password ? "***" : "NO CONFIGURADA"}`);

  if (!password || password === "youshallnotpass") {
    log.warn("Lavalink", "⚠️ Usando contraseña por defecto. Configura LAVALINK_PASSWORD en tus variables de entorno.");
  }

  lavalinkManager = new LavalinkManager({
    nodes: [
      {
        authorization: password,
        host,
        port,
        id: "Main Node",
        secure,
        retryAmount: 5,
        retryDelay: 10000
      }
    ],
    sendToShard: (guildId, payload) => {
      const guild = discordClient.guilds.cache.get(guildId);
      if (guild) {
        guild.shard.send(payload);
      }
    },
    client: {
      id: discordClient.user.id,
      username: discordClient.user.username
    }
  });

  // Eventos de conexión
  lavalinkManager.on("nodeConnect", (node) => {
    log.info("Lavalink", `✅ Nodo conectado: ${node.id} (${node.host}:${node.port})`);
  });

  lavalinkManager.on("nodeDisconnect", (node, reason) => {
    log.warn("Lavalink", `⚠️ Nodo desconectado: ${node.id} - Razón: ${reason}`);
  });

  lavalinkManager.on("nodeError", (node, error) => {
    log.error("Lavalink", `❌ Error en nodo ${node.id}:`, error);
    if (error.message) {
      log.error("Lavalink", `   Mensaje: ${error.message}`);
    }
    if (error.code) {
      log.error("Lavalink", `   Código: ${error.code}`);
    }
  });

  lavalinkManager.on("nodeReconnect", (node) => {
    log.info("Lavalink", `🔄 Reconectando nodo: ${node.id}`);
  });

  // Inicializar
  try {
    lavalinkManager.init(discordClient.user);
    log.info("Lavalink", `✅ Cliente inicializado - Host: ${host}:${port}, Secure: ${secure}`);
  } catch (error) {
    log.error("Lavalink", `❌ Error al inicializar Lavalink:`, error);
    throw error;
  }

  return lavalinkManager;
}

/**
 * Obtiene el cliente de Lavalink
 * @returns {LavalinkManager|null}
 */
export function getLavalinkClient() {
  return lavalinkManager;
}

/**
 * Verifica si el cliente está conectado
 * @returns {boolean}
 */
export function isConnected() {
  return lavalinkManager !== null && lavalinkManager.nodes.size > 0;
}

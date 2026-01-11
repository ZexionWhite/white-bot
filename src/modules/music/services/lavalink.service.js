/**
 * Servicio de conexión a Lavalink
 * Maneja la conexión y gestión de nodos de Lavalink con manejo robusto de errores
 */
import { LavalinkManager } from "lavalink-client";
import { log } from "../../../core/logger/index.js";

// Estado del servicio
let lavalinkManager = null;
let connectionState = "DISCONNECTED"; // DISCONNECTED, CONNECTING, CONNECTED, UNAVAILABLE
let nodeStatus = null;
let reconnectAttempts = 0;
let lastError = null;

// Configuración
let config = null;

/**
 * Diagnóstico de red: verifica si Lavalink está accesible vía HTTP
 * @param {string} host - Host de Lavalink
 * @param {number} port - Puerto
 * @param {boolean} secure - Si usa HTTPS
 * @returns {Promise<{available: boolean, error?: string}>}
 */
async function diagnoseLavalinkConnection(host, port, secure) {
  const protocol = secure ? "https" : "http";
  const url = `${protocol}://${host}:${port}/version`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Authorization": config?.password || ""
      }
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      return { available: true };
    } else if (response.status === 401 || response.status === 403) {
      return { available: false, error: "AUTH_FAILED", status: response.status };
    } else {
      return { available: false, error: "HTTP_ERROR", status: response.status };
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return { available: false, error: "TIMEOUT" };
    } else if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      return { available: false, error: "DNS_FAILED", code: error.code };
    } else if (error.code === "ECONNREFUSED") {
      return { available: false, error: "CONNECTION_REFUSED", code: error.code };
    } else {
      return { available: false, error: "NETWORK_ERROR", message: error.message, code: error.code };
    }
  }
}

/**
 * Inicializa el cliente de Lavalink con manejo robusto de errores
 * @param {import("discord.js").Client} discordClient - Cliente de Discord
 */
export async function initializeLavalink(discordClient) {
  if (lavalinkManager) {
    log.warn("Lavalink", "Cliente ya inicializado");
    return lavalinkManager;
  }

  const host = process.env.LAVALINK_HOST || "localhost";
  const port = parseInt(process.env.LAVALINK_PORT || "2333", 10);
  const password = process.env.LAVALINK_PASSWORD || "youshallnotpass";
  const secure = (process.env.LAVALINK_SECURE || "false").toLowerCase() === "true";

  config = { host, port, password, secure };

  log.info("Lavalink", `Configurando conexión a Lavalink...`);
  log.info("Lavalink", `  Host: ${host}`);
  log.info("Lavalink", `  Port: ${port}`);
  log.info("Lavalink", `  Secure: ${secure}`);
  log.info("Lavalink", `  Password: ${password ? "***" : "NO CONFIGURADA"}`);

  if (!password || password === "youshallnotpass") {
    log.warn("Lavalink", "⚠️ Usando contraseña por defecto. Configura LAVALINK_PASSWORD en tus variables de entorno.");
  }

  // Diagnóstico de red previo
  log.info("Lavalink", "🔍 Ejecutando diagnóstico de red...");
  const diagnosis = await diagnoseLavalinkConnection(host, port, secure);
  
  if (!diagnosis.available) {
    const errorMsg = diagnosis.error === "DNS_FAILED" 
      ? `No se puede resolver el hostname '${host}'. Verifica LAVALINK_HOST o configura red Docker compartida.`
      : diagnosis.error === "AUTH_FAILED"
      ? `Error de autenticación (${diagnosis.status}). Verifica LAVALINK_PASSWORD.`
      : diagnosis.error === "CONNECTION_REFUSED"
      ? `Conexión rechazada. Verifica que Lavalink esté corriendo en ${host}:${port}.`
      : diagnosis.error === "TIMEOUT"
      ? `Timeout al conectar. Verifica firewall o red.`
      : `Error de red: ${diagnosis.error} (${diagnosis.code || diagnosis.status || "unknown"})`;
    
    log.error("Lavalink", `❌ Diagnóstico falló: ${errorMsg}`);
    connectionState = "UNAVAILABLE";
    lastError = { type: diagnosis.error, message: errorMsg, code: diagnosis.code, status: diagnosis.status };
    log.warn("Lavalink", "El bot continuará sin funcionalidad de música hasta que Lavalink esté disponible.");
    return null;
  }

  log.info("Lavalink", "✅ Diagnóstico exitoso: Lavalink está accesible");

  connectionState = "CONNECTING";

  try {
    lavalinkManager = new LavalinkManager({
      nodes: [
        {
          authorization: password,
          host,
          port,
          id: "Main Node",
          secure,
          retryAmount: 10, // Más intentos
          retryDelay: 15000, // 15 segundos entre intentos
          retryTimespan: 300000, // 5 minutos de ventana de reintentos
          requestSignalTimeoutMS: 30000, // 30 segundos timeout
          closeOnError: false, // NO cerrar en error, manejar manualmente
          heartBeatInterval: 30000
        }
      ],
      sendToShard: (guildId, payload) => {
        try {
          const guild = discordClient.guilds.cache.get(guildId);
          if (guild) {
            guild.shard.send(payload);
          }
        } catch (error) {
          log.error("Lavalink", `Error enviando payload a shard ${guildId}:`, error);
        }
      },
      client: {
        id: discordClient.user.id,
        username: discordClient.user.username
      }
    });

    // Registrar TODOS los eventos posibles
    setupEventListeners(discordClient);

    // Inicializar (no bloquear si falla)
    try {
      // init() requiere un objeto con id y username, no el user object directamente
      lavalinkManager.init({
        id: discordClient.user.id,
        username: discordClient.user.username
      });
      log.info("Lavalink", `✅ Cliente inicializado - Host: ${host}:${port}, Secure: ${secure}`);
    } catch (error) {
      log.error("Lavalink", `❌ Error al inicializar Lavalink:`, error);
      connectionState = "UNAVAILABLE";
      lastError = { type: "INIT_ERROR", message: error.message, stack: error.stack };
      // NO hacer throw - el bot debe continuar
      return null;
    }

    return lavalinkManager;
  } catch (error) {
    log.error("Lavalink", `❌ Error creando LavalinkManager:`, error);
    connectionState = "UNAVAILABLE";
    lastError = { type: "CREATE_ERROR", message: error.message, stack: error.stack };
    // NO hacer throw
    return null;
  }
}

/**
 * Configura todos los event listeners de Lavalink
 * @param {import("discord.js").Client} discordClient - Cliente de Discord
 */
function setupEventListeners(discordClient) {
  // Nodo conectado exitosamente
  lavalinkManager.on("nodeConnect", (node) => {
    connectionState = "CONNECTED";
    reconnectAttempts = 0;
    lastError = null;
    nodeStatus = {
      id: node.id,
      host: node.host,
      port: node.port,
      connected: true,
      connectedAt: Date.now()
    };
    log.info("Lavalink", `✅ Nodo conectado: ${node.id} (${node.host}:${node.port})`);
    log.debug("Lavalink", `Estado del nodo - isAlive: ${node.isAlive}, estado interno: ${connectionState}`);
  });

  // Nodo desconectado
  lavalinkManager.on("nodeDisconnect", (node, reason) => {
    connectionState = "DISCONNECTED";
    if (nodeStatus) {
      nodeStatus.connected = false;
      nodeStatus.disconnectedAt = Date.now();
      nodeStatus.lastDisconnectReason = reason;
    }
    log.warn("Lavalink", `⚠️ Nodo desconectado: ${node.id} (${node.host}:${node.port}) - Razón: ${reason}`);
    
    // El cliente automáticamente intentará reconectar según retryAmount/retryDelay
    connectionState = "CONNECTING";
  });

  // Error en nodo
  lavalinkManager.on("nodeError", (node, error) => {
    reconnectAttempts++;
    lastError = {
      type: "NODE_ERROR",
      nodeId: node.id,
      message: error.message,
      code: error.code,
      timestamp: Date.now()
    };

    // Detectar tipos específicos de errores
    let errorType = "UNKNOWN";
    let userMessage = error.message;

    if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      errorType = "DNS_FAILED";
      userMessage = `No se puede resolver el hostname '${node.host}'. Verifica LAVALINK_HOST.`;
    } else if (error.code === "ECONNREFUSED") {
      errorType = "CONNECTION_REFUSED";
      userMessage = `Conexión rechazada. Verifica que Lavalink esté corriendo.`;
    } else if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      errorType = "AUTH_FAILED";
      userMessage = `Error de autenticación. Verifica LAVALINK_PASSWORD.`;
    } else if (error.code === "ERR_UNHANDLED_ERROR") {
      errorType = "WEBSOCKET_ERROR";
      userMessage = `Error en WebSocket. Verifica conectividad de red.`;
    }

    lastError.errorType = errorType;

    log.error("Lavalink", `❌ Error en nodo ${node.id} (intento ${reconnectAttempts}):`, {
      message: error.message,
      code: error.code,
      type: errorType,
      host: node.host,
      port: node.port
    });

    // NO hacer throw - solo loggear
    // El cliente manejará la reconexión automáticamente
  });

  // Nodo reconectando
  lavalinkManager.on("nodeReconnect", (node) => {
    connectionState = "CONNECTING";
    log.info("Lavalink", `🔄 Reconectando nodo: ${node.id} (${node.host}:${node.port}) - Intento ${reconnectAttempts + 1}`);
  });

  // Agregar listener genérico para cualquier error no capturado
  lavalinkManager.nodeManager?.on("error", (error) => {
    log.error("Lavalink", "Error en NodeManager (capturado):", error);
    // NO hacer throw - solo loggear
  });

  // Prevenir que errores del WebSocket crasheen el proceso
  // Los nodos manejan sus propios errores, pero asegurémonos de capturar todo
  const nodes = lavalinkManager.nodeManager?.nodes;
  if (nodes) {
    for (const node of nodes.values()) {
      if (node && typeof node.on === "function") {
        // Ya tenemos nodeError, pero por si acaso
        node.on("error", (error) => {
          log.error("Lavalink", `Error en nodo ${node.id} (capturado):`, error);
          // NO hacer throw
        });
      }
    }
  }
}

/**
 * Obtiene el cliente de Lavalink
 * @returns {LavalinkManager|null}
 */
export function getLavalinkClient() {
  return lavalinkManager;
}

/**
 * Verifica si Lavalink está listo y disponible
 * @returns {boolean}
 */
export function isLavalinkReady() {
  if (!lavalinkManager) return false;
  
  // Verificar directamente el estado del nodo sin depender solo del estado interno
  try {
    const nodeManager = lavalinkManager.nodeManager;
    if (!nodeManager || !nodeManager.nodes) return false;
    
    // Buscar al menos un nodo que esté conectado
    for (const node of nodeManager.nodes.values()) {
      if (node && node.isAlive === true) {
        // Si encontramos un nodo vivo, actualizar el estado interno si es necesario
        if (connectionState !== "CONNECTED") {
          connectionState = "CONNECTED";
          log.debug("Lavalink", `Estado actualizado a CONNECTED (nodo ${node.id} está vivo)`);
        }
        return true;
      }
    }
    
    // Si no hay nodos vivos pero el manager existe, el estado es DISCONNECTED
    if (connectionState === "CONNECTED") {
      connectionState = "DISCONNECTED";
      log.debug("Lavalink", "Estado actualizado a DISCONNECTED (no hay nodos vivos)");
    }
    
    return false;
  } catch (error) {
    log.error("Lavalink", "Error verificando estado de nodos:", error);
    return false;
  }
}

/**
 * Obtiene el estado actual del nodo de Lavalink
 * @returns {object|null}
 */
export function getNodeStatus() {
  if (!lavalinkManager || !nodeStatus) {
    return {
      state: connectionState,
      available: false,
      error: lastError
    };
  }

  const node = lavalinkManager.nodeManager?.nodes?.get("Main Node");
  
  return {
    state: connectionState,
    available: isLavalinkReady(),
    node: {
      id: nodeStatus.id,
      host: nodeStatus.host,
      port: nodeStatus.port,
      connected: node?.isAlive !== false,
      connectedAt: nodeStatus.connectedAt,
      lastDisconnectReason: nodeStatus.lastDisconnectReason
    },
    reconnectAttempts,
    lastError
  };
}

/**
 * Verifica si el cliente está conectado (método legacy - usar isLavalinkReady)
 * @returns {boolean}
 */
export function isConnected() {
  return isLavalinkReady();
}

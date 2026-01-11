/**
 * Servicio de conexión a Lavalink
 * SINGLETON: Solo una instancia de LavalinkManager por proceso
 */
import { LavalinkManager } from "lavalink-client";
import { log } from "../../../core/logger/index.js";

// INSTANCE_ID único para detectar múltiples inicializaciones
// Usar timestamp + random para garantizar unicidad
const INSTANCE_ID = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`.substring(0, 8);

// SINGLETON: Variable privada del módulo
let lavalinkManager = null;
let connectionState = "DISCONNECTED"; // DISCONNECTED, CONNECTING, CONNECTED, UNAVAILABLE
let nodeStatus = null;
let reconnectAttempts = 0;
let lastError = null;
let initializationInProgress = false;
let initializationPromise = null;

// Configuración
let config = null;

/**
 * Helper para capturar stack trace (simplificado)
 */
function getStackTrace() {
  const err = new Error();
  return err.stack;
}

/**
 * Instrumentación: Interceptar destroy/disconnect/close para logging
 */
function instrumentManager(manager) {
  if (!manager) return;

  // Interceptar destroy si existe
  if (manager.destroy && typeof manager.destroy === "function") {
    const originalDestroy = manager.destroy.bind(manager);
    manager.destroy = function(...args) {
      const stack = getStackTrace();
      log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ DESTROY LLAMADO EN MANAGER ⚠️⚠️⚠️`);
      log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
      return originalDestroy.apply(this, args);
    };
  }

  // Interceptar disconnect si existe
  if (manager.disconnect && typeof manager.disconnect === "function") {
    const originalDisconnect = manager.disconnect.bind(manager);
    manager.disconnect = function(...args) {
      const stack = getStackTrace();
      log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ DISCONNECT LLAMADO EN MANAGER ⚠️⚠️⚠️`);
      log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
      return originalDisconnect.apply(this, args);
    };
  }

  // Instrumentar nodeManager si existe
  if (manager.nodeManager) {
    if (manager.nodeManager.destroy && typeof manager.nodeManager.destroy === "function") {
      const originalNodeDestroy = manager.nodeManager.destroy.bind(manager.nodeManager);
      manager.nodeManager.destroy = function(...args) {
        const stack = getStackTrace();
        log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ DESTROY LLAMADO EN NODEMANAGER ⚠️⚠️⚠️`);
        log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
        return originalNodeDestroy.apply(this, args);
      };
    }

    // Instrumentar nodos existentes
    instrumentNodes(manager.nodeManager);
  }
}

/**
 * Instrumenta nodos individuales (llamado cuando se crean)
 */
function instrumentNodes(nodeManager) {
  if (!nodeManager || !nodeManager.nodes) return;

  for (const node of nodeManager.nodes.values()) {
    if (!node) continue;

    // Instrumentar destroy del nodo
    if (node.destroy && typeof node.destroy === "function" && !node._instrumentedDestroy) {
      const originalNodeDestroy = node.destroy.bind(node);
      node.destroy = function(...args) {
        const stack = getStackTrace();
        log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ DESTROY LLAMADO EN NODE ${node.id} ⚠️⚠️⚠️`);
        log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
        return originalNodeDestroy.apply(this, args);
      };
      node._instrumentedDestroy = true;
    }

    // Instrumentar disconnect del nodo
    if (node.disconnect && typeof node.disconnect === "function" && !node._instrumentedDisconnect) {
      const originalNodeDisconnect = node.disconnect.bind(node);
      node.disconnect = function(...args) {
        const stack = getStackTrace();
        log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ DISCONNECT LLAMADO EN NODE ${node.id} ⚠️⚠️⚠️`);
        log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
        return originalNodeDisconnect.apply(this, args);
      };
      node._instrumentedDisconnect = true;
    }

    // Instrumentar socket.close si existe
    if (node.socket && node.socket.close && typeof node.socket.close === "function" && !node.socket._instrumentedClose) {
      const originalClose = node.socket.close.bind(node.socket);
      node.socket.close = function(...args) {
        const stack = getStackTrace();
        log.error("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ CLOSE LLAMADO EN SOCKET DEL NODE ${node.id} ⚠️⚠️⚠️`);
        log.error("Lavalink", `[${INSTANCE_ID}] Stack trace:`, stack);
        return originalClose.apply(this, args);
      };
      node.socket._instrumentedClose = true;
    }
  }
}

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
    const timeout = setTimeout(() => controller.abort(), 5000);
    
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
 * Obtiene o crea el LavalinkManager (SINGLETON)
 * @returns {LavalinkManager|null}
 */
export function getLavalinkManager() {
  if (lavalinkManager) {
    return lavalinkManager;
  }
  return null;
}

/**
 * Inicializa el cliente de Lavalink (SINGLETON - solo se llama UNA vez)
 * @param {import("discord.js").Client} discordClient - Cliente de Discord
 * @returns {Promise<LavalinkManager|null>}
 */
export async function initializeLavalink(discordClient) {
  // SINGLETON: Si ya existe, retornar la misma instancia
  if (lavalinkManager) {
    log.warn("Lavalink", `[${INSTANCE_ID}] ⚠️ initializeLavalink llamado pero ya existe manager (singleton)`);
    log.warn("Lavalink", `[${INSTANCE_ID}] Stack trace:`, getStackTrace());
    return lavalinkManager;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (initializationInProgress && initializationPromise) {
    log.warn("Lavalink", `[${INSTANCE_ID}] ⚠️ Inicialización ya en progreso, esperando...`);
    log.warn("Lavalink", `[${INSTANCE_ID}] Stack trace:`, getStackTrace());
    return initializationPromise;
  }

  // Crear promesa de inicialización
  initializationInProgress = true;
  initializationPromise = (async () => {
    try {
      log.info("Lavalink", `[${INSTANCE_ID}] ===== INICIALIZACIÓN LAVALINK (SINGLETON) =====`);

      const host = process.env.LAVALINK_HOST || "localhost";
      const port = parseInt(process.env.LAVALINK_PORT || "2333", 10);
      const password = process.env.LAVALINK_PASSWORD || "youshallnotpass";
      const secure = (process.env.LAVALINK_SECURE || "false").toLowerCase() === "true";

      config = { host, port, password, secure };

      log.info("Lavalink", `[${INSTANCE_ID}] Config: Host=${host}, Port=${port}, Secure=${secure}`);

      if (!password || password === "youshallnotpass") {
        log.warn("Lavalink", `[${INSTANCE_ID}] ⚠️ Usando contraseña por defecto`);
      }

      // Diagnóstico de red
      log.info("Lavalink", `[${INSTANCE_ID}] 🔍 Diagnóstico de red...`);
      const diagnosis = await diagnoseLavalinkConnection(host, port, secure);
      
      if (!diagnosis.available) {
        const errorMsg = diagnosis.error === "DNS_FAILED" 
          ? `DNS failed: ${host}`
          : diagnosis.error === "AUTH_FAILED"
          ? `Auth failed (${diagnosis.status})`
          : diagnosis.error === "CONNECTION_REFUSED"
          ? `Connection refused: ${host}:${port}`
          : diagnosis.error === "TIMEOUT"
          ? `Timeout`
          : `Network error: ${diagnosis.error}`;
        
        log.error("Lavalink", `[${INSTANCE_ID}] ❌ Diagnóstico falló: ${errorMsg}`);
        connectionState = "UNAVAILABLE";
        lastError = { type: diagnosis.error, message: errorMsg, code: diagnosis.code, status: diagnosis.status };
        initializationInProgress = false;
        initializationPromise = null;
        return null;
      }

      log.info("Lavalink", `[${INSTANCE_ID}] ✅ Diagnóstico OK`);

      connectionState = "CONNECTING";

      // CREAR MANAGER (SINGLETON)
      log.info("Lavalink", `[${INSTANCE_ID}] Creando LavalinkManager...`);
      lavalinkManager = new LavalinkManager({
        nodes: [
          {
            authorization: password,
            host,
            port,
            id: "Main Node",
            secure,
            retryAmount: 10,
            retryDelay: 15000,
            retryTimespan: 300000,
            requestSignalTimeoutMS: 30000,
            closeOnError: false, // CRÍTICO: NO cerrar automáticamente
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
            log.error("Lavalink", `[${INSTANCE_ID}] Error sendToShard:`, error);
          }
        },
        client: {
          id: discordClient.user.id,
          username: discordClient.user.username
        }
      });

      log.info("Lavalink", `[${INSTANCE_ID}] LavalinkManager creado`);

      // INSTRUMENTAR para detectar destroy/disconnect/close
      instrumentManager(lavalinkManager);

      // Registrar eventos ANTES de init
      setupEventListeners(discordClient);

      // INICIALIZAR (una sola vez)
      log.info("Lavalink", `[${INSTANCE_ID}] Llamando init()...`);
      lavalinkManager.init({
        id: discordClient.user.id,
        username: discordClient.user.username
      });

      log.info("Lavalink", `[${INSTANCE_ID}] ✅ init() completado`);
      log.info("Lavalink", `[${INSTANCE_ID}] ===== INICIALIZACIÓN COMPLETA =====`);

      initializationInProgress = false;
      return lavalinkManager;
    } catch (error) {
      log.error("Lavalink", `[${INSTANCE_ID}] ❌ Error en inicialización:`, error);
      log.error("Lavalink", `[${INSTANCE_ID}] Stack:`, error.stack);
      connectionState = "UNAVAILABLE";
      lastError = { type: "INIT_ERROR", message: error.message, stack: error.stack };
      lavalinkManager = null;
      initializationInProgress = false;
      initializationPromise = null;
      return null;
    }
  })();

  return initializationPromise;
}

/**
 * Configura event listeners con logs detallados
 */
function setupEventListeners(discordClient) {
  // nodeConnect
  lavalinkManager.on("nodeConnect", (node) => {
    // Instrumentar el nodo cuando se conecta (por si no se hizo antes)
    if (lavalinkManager.nodeManager) {
      instrumentNodes(lavalinkManager.nodeManager);
    }

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
    log.info("Lavalink", `[${INSTANCE_ID}] ✅✅✅ NODO CONECTADO ✅✅✅`);
    log.info("Lavalink", `[${INSTANCE_ID}]   Node: ${node.id} (${node.host}:${node.port})`);
    log.info("Lavalink", `[${INSTANCE_ID}]   isAlive: ${node.isAlive}`);
    log.info("Lavalink", `[${INSTANCE_ID}]   connectionState: ${connectionState}`);
  });

  // nodeDisconnect
  lavalinkManager.on("nodeDisconnect", (node, reason) => {
    connectionState = "DISCONNECTED";
    if (nodeStatus) {
      nodeStatus.connected = false;
      nodeStatus.disconnectedAt = Date.now();
      nodeStatus.lastDisconnectReason = reason;
    }
    log.warn("Lavalink", `[${INSTANCE_ID}] ⚠️⚠️⚠️ NODO DESCONECTADO ⚠️⚠️⚠️`);
    log.warn("Lavalink", `[${INSTANCE_ID}]   Node: ${node.id} (${node.host}:${node.port})`);
    log.warn("Lavalink", `[${INSTANCE_ID}]   Razón: ${reason || "Sin razón"}`);
    log.warn("Lavalink", `[${INSTANCE_ID}]   Intento: ${reconnectAttempts}`);
    connectionState = "CONNECTING";
  });

  // nodeError
  lavalinkManager.on("nodeError", (node, error) => {
    reconnectAttempts++;
    lastError = {
      type: "NODE_ERROR",
      nodeId: node.id,
      message: error.message,
      code: error.code,
      timestamp: Date.now()
    };

    let errorType = "UNKNOWN";
    if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
      errorType = "DNS_FAILED";
    } else if (error.code === "ECONNREFUSED") {
      errorType = "CONNECTION_REFUSED";
    } else if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      errorType = "AUTH_FAILED";
    } else if (error.code === "ERR_UNHANDLED_ERROR") {
      errorType = "WEBSOCKET_ERROR";
    } else if (error.code === 1006) {
      errorType = "WEBSOCKET_CLOSED_ABNORMALLY";
    }

    lastError.errorType = errorType;

    log.error("Lavalink", `[${INSTANCE_ID}] ❌ Error en nodo ${node.id} (${reconnectAttempts}):`);
    log.error("Lavalink", `[${INSTANCE_ID}]   Tipo: ${errorType}`);
    log.error("Lavalink", `[${INSTANCE_ID}]   Code: ${error.code}`);
    log.error("Lavalink", `[${INSTANCE_ID}]   Message: ${error.message}`);
    if (error.stack) {
      log.error("Lavalink", `[${INSTANCE_ID}]   Stack: ${error.stack}`);
    }
  });

  // nodeReconnect
  lavalinkManager.on("nodeReconnect", (node) => {
    connectionState = "CONNECTING";
    log.info("Lavalink", `[${INSTANCE_ID}] 🔄 Reconectando: ${node.id} (intento ${reconnectAttempts + 1})`);
  });

  // Error en nodeManager
  lavalinkManager.nodeManager?.on("error", (error) => {
    log.error("Lavalink", `[${INSTANCE_ID}] Error en NodeManager:`, error);
  });

  // Errores en nodos individuales
  const nodes = lavalinkManager.nodeManager?.nodes;
  if (nodes) {
    for (const node of nodes.values()) {
      if (node && typeof node.on === "function") {
        node.on("error", (error) => {
          log.error("Lavalink", `[${INSTANCE_ID}] Error en nodo ${node.id}:`, error);
        });
      }
    }
  }
}

/**
 * Obtiene el cliente de Lavalink (alias para compatibilidad)
 * @returns {LavalinkManager|null}
 */
export function getLavalinkClient() {
  return getLavalinkManager();
}

/**
 * Verifica si Lavalink está listo
 * @returns {boolean}
 */
export function isLavalinkReady() {
  if (!lavalinkManager) return false;
  
  try {
    const nodeManager = lavalinkManager.nodeManager;
    if (!nodeManager || !nodeManager.nodes) return false;
    
    for (const node of nodeManager.nodes.values()) {
      if (node && node.isAlive === true) {
        if (connectionState !== "CONNECTED") {
          connectionState = "CONNECTED";
        }
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log.error("Lavalink", `[${INSTANCE_ID}] Error en isLavalinkReady:`, error);
    return false;
  }
}

/**
 * Obtiene el estado del nodo
 * @returns {object}
 */
export function getNodeStatus() {
  if (!lavalinkManager || !nodeStatus) {
    return {
      state: connectionState,
      available: false,
      error: lastError,
      instanceId: INSTANCE_ID
    };
  }

  const node = lavalinkManager.nodeManager?.nodes?.get("Main Node");
  
  return {
    state: connectionState,
    available: isLavalinkReady(),
    instanceId: INSTANCE_ID,
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
 * Método legacy (usar isLavalinkReady)
 */
export function isConnected() {
  return isLavalinkReady();
}

/**
 * Sistema de tracking de peticiones a la API de Discord
 * Monitorea las peticiones y muestra estadísticas cada 10 minutos
 */

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutos en ms
const MAX_REQUESTS_PER_WINDOW = 10000; // Límite de Discord

let requestCount = 0;
let requestHistory = [];
let logInterval = null;

/**
 * Registra una petición a la API
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, etc.)
 * @param {string} route - Ruta de la API
 */
export function trackRequest(method, route) {
  const now = Date.now();
  
  // Agregar a historial
  requestHistory.push({
    timestamp: now,
    method,
    route
  });
  
  // Limpiar peticiones antiguas (más de 10 minutos)
  requestHistory = requestHistory.filter(req => now - req.timestamp < RATE_LIMIT_WINDOW);
  
  // Actualizar contador
  requestCount = requestHistory.length;
}

/**
 * Obtiene estadísticas de peticiones
 */
export function getRequestStats() {
  const now = Date.now();
  const recentRequests = requestHistory.filter(req => now - req.timestamp < RATE_LIMIT_WINDOW);
  
  // Agrupar por método
  const byMethod = {};
  recentRequests.forEach(req => {
    byMethod[req.method] = (byMethod[req.method] || 0) + 1;
  });
  
  // Agrupar por ruta (top 10)
  const byRoute = {};
  recentRequests.forEach(req => {
    const route = req.route.split('?')[0]; // Quitar query params
    byRoute[route] = (byRoute[route] || 0) + 1;
  });
  
  const topRoutes = Object.entries(byRoute)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    total: recentRequests.length,
    percentage: ((recentRequests.length / MAX_REQUESTS_PER_WINDOW) * 100).toFixed(2),
    byMethod,
    topRoutes,
    remaining: MAX_REQUESTS_PER_WINDOW - recentRequests.length
  };
}

/**
 * Muestra el log de estadísticas en consola
 */
function logStats() {
  const stats = getRequestStats();
  
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           📊 ESTADÍSTICAS DE API (Últimos 10 min)         ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║  Total de peticiones:     ${String(stats.total).padEnd(30)} ║`);
  console.log(`║  Porcentaje usado:        ${String(stats.percentage + "%").padEnd(30)} ║`);
  console.log(`║  Peticiones restantes:    ${String(stats.remaining).padEnd(30)} ║`);
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log("║  Por método HTTP:                                         ║");
  
  const methodEntries = Object.entries(stats.byMethod).sort((a, b) => b[1] - a[1]);
  methodEntries.forEach(([method, count]) => {
    console.log(`║    ${method.padEnd(6)}: ${String(count).padEnd(35)} ║`);
  });
  
  if (stats.topRoutes.length > 0) {
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log("║  Top 10 rutas más usadas:                                 ║");
    stats.topRoutes.forEach(([route, count], index) => {
      const routeDisplay = route.length > 40 ? route.substring(0, 37) + "..." : route;
      console.log(`║    ${String(index + 1).padStart(2)}. ${routeDisplay.padEnd(40)} ║`);
      console.log(`║        ${String(count + " peticiones").padEnd(44)} ║`);
    });
  }
  
  if (stats.percentage > 80) {
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log("║  ⚠️  ADVERTENCIA: Uso de API cercano al límite           ║");
  }
  
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

/**
 * Inicia el sistema de tracking
 */
export function startApiTracker(client) {
  if (logInterval) {
    console.warn("[ApiTracker] El tracker ya está activo.");
    return;
  }

  // Interceptar peticiones REST usando el REST manager del cliente
  if (client && client.rest) {
    // Escuchar eventos de rate limit
    client.rest.on("rateLimited", (rateLimitInfo) => {
      console.warn(`[ApiTracker] ⚠️ Rate limit detectado:`, {
        route: rateLimitInfo.route,
        limit: rateLimitInfo.limit,
        timeToReset: rateLimitInfo.timeToReset,
        retryAfter: rateLimitInfo.retryAfter
      });
    });

    // Interceptar peticiones usando el request handler
    const originalRequest = client.rest.request.bind(client.rest);
    
    client.rest.request = async function(options) {
      const method = options.method || "GET";
      const route = options.url || options.path || options.route || "unknown";
      
      // Registrar la petición ANTES de ejecutarla
      trackRequest(method, route);
      
      try {
        const response = await originalRequest(options);
        return response;
      } catch (error) {
        // Si es un rate limit, también lo registramos
        if (error.status === 429 || error.code === 429) {
          const retryAfter = error.retryAfter || error.timeToReset || 60000;
          console.warn(`[ApiTracker] Rate limit en ${method} ${route}. Reintentar en ${retryAfter}ms`);
        }
        throw error;
      }
    };
    
    console.log("[ApiTracker] ✅ Interceptor de REST configurado.");
  } else {
    console.warn("[ApiTracker] ⚠️ No se pudo acceder al REST manager del cliente.");
  }

  // Mostrar estadísticas cada 10 minutos
  logInterval = setInterval(() => {
    logStats();
  }, RATE_LIMIT_WINDOW);

  // Mostrar estadísticas iniciales después de 10 minutos
  setTimeout(() => {
    logStats();
  }, RATE_LIMIT_WINDOW);

  console.log("[ApiTracker] ✅ Sistema de tracking iniciado. Logs cada 10 minutos.");
}

/**
 * Detiene el sistema de tracking
 */
export function stopApiTracker() {
  if (logInterval) {
    clearInterval(logInterval);
    logInterval = null;
    console.log("[ApiTracker] Sistema de tracking detenido.");
  }
}

/**
 * Obtiene el contador actual de peticiones
 */
export function getCurrentRequestCount() {
  return requestCount;
}

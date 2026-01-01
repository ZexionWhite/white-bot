import { ActivityType } from "discord.js";

/**
 * Configuración de actividades para rotar
 * Cada actividad debe tener: name, type, y opcionalmente interval (en ms)
 */
const ACTIVITIES = [
  {
    name: "/help",
    type: ActivityType.Custom,
    interval: 60000 // 60 segundos
  },
  {
    name: (client) => {
      const guildCount = client.guilds.cache.size;
      const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      return `${guildCount} servidores • ${memberCount.toLocaleString("es-AR")} usuarios`;
    },
    type: ActivityType.Watching,
    interval: 60000 // 60 segundos
  }
];

let currentActivityIndex = 0;
let rotationTimeout = null;

/**
 * Obtiene el nombre de la actividad (puede ser string o función)
 */
function getActivityName(activity, client) {
  if (typeof activity.name === "function") {
    return activity.name(client);
  }
  return activity.name;
}

/**
 * Establece la actividad actual del bot
 */
async function setActivity(client) {
  if (!client.user) return;

  const activity = ACTIVITIES[currentActivityIndex];
  const name = getActivityName(activity, client);

  try {
    await client.user.setActivity(name, { type: activity.type });
    console.log(`[ActivityRotator] Actividad actualizada: ${name} (${ActivityType[activity.type]})`);
  } catch (error) {
    if (error.status === 429 || error.code === 50035) {
      // Rate limit o invalid form body
      const retryAfter = error.retryAfter || 60000; // Default 1 min si no viene retryAfter
      console.warn(`[ActivityRotator] Rate limit detectado. Reintentando en ${retryAfter}ms`);
      
      // Programar reintento después del retryAfter
      setTimeout(() => {
        setActivity(client).catch(err => {
          console.error(`[ActivityRotator] Error al reintentar actividad:`, err.message);
        });
      }, retryAfter);
    } else {
      console.error(`[ActivityRotator] Error al establecer actividad:`, error.message);
      // Continuar con la rotación normal aunque falle
    }
  }
}

/**
 * Rota a la siguiente actividad
 */
function rotateActivity(client) {
  currentActivityIndex = (currentActivityIndex + 1) % ACTIVITIES.length;
  setActivity(client).catch(err => {
    console.error(`[ActivityRotator] Error en rotación:`, err.message);
  });
}

/**
 * Programa la siguiente rotación de actividad
 */
function scheduleNextRotation(client, defaultInterval) {
  const currentActivity = ACTIVITIES[currentActivityIndex];
  const interval = currentActivity.interval || defaultInterval;
  
  rotationTimeout = setTimeout(() => {
    rotateActivity(client);
    scheduleNextRotation(client, defaultInterval);
  }, interval);
}

/**
 * Inicia el rotador de actividades
 * @param {Client} client - Cliente de Discord
 * @param {number} defaultInterval - Intervalo por defecto en ms (si no se especifica en la actividad)
 */
export function startActivityRotator(client, defaultInterval = 30000) {
  if (rotationTimeout) {
    console.warn("[ActivityRotator] El rotador ya está activo. Deteniendo el anterior...");
    stopActivityRotator();
  }

  if (ACTIVITIES.length === 0) {
    console.warn("[ActivityRotator] No hay actividades configuradas.");
    return;
  }

  // Establecer la actividad inicial
  setActivity(client);

  // Iniciar la rotación
  scheduleNextRotation(client, defaultInterval);

  console.log(`[ActivityRotator] Rotador iniciado con ${ACTIVITIES.length} actividades.`);
}

/**
 * Detiene el rotador de actividades
 */
export function stopActivityRotator() {
  if (rotationTimeout) {
    clearTimeout(rotationTimeout);
    rotationTimeout = null;
    console.log("[ActivityRotator] Rotador detenido.");
  }
}

/**
 * Obtiene la lista de actividades configuradas (para debugging)
 */
export function getActivities() {
  return ACTIVITIES.map((act, index) => ({
    index,
    name: typeof act.name === "function" ? "[Función dinámica]" : act.name,
    type: ActivityType[act.type],
    interval: act.interval || "default"
  }));
}

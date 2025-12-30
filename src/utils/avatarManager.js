import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AVATARS_DIR = path.join(__dirname, "../assets/avatars");
const STATE_FILE = path.join(process.cwd(), "data", "avatar-state.json");
const COOLDOWN_MS = 60 * 60 * 1000;
const RATE_LIMIT_BACKOFF_MS = 6 * 60 * 60 * 1000;

let lastAvatarPath = null;
let lastChangeTimestamp = 0;
let rateLimitUntil = 0;
let avatarFiles = [];

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return { lastAvatarFileName: null, lastChangeTimestamp: 0, rateLimitUntil: 0 };
    }

    const data = fs.readFileSync(STATE_FILE, "utf-8");
    const state = JSON.parse(data);
    
    return {
      lastAvatarFileName: state.lastAvatarFileName || null,
      lastChangeTimestamp: state.lastChangeTimestamp || 0,
      rateLimitUntil: state.rateLimitUntil || 0
    };
  } catch (error) {
    console.warn(`[AvatarManager] Error al cargar estado:`, error.message);
    return { lastAvatarFileName: null, lastChangeTimestamp: 0, rateLimitUntil: 0 };
  }
}

function saveState() {
  try {
    const stateDir = path.dirname(STATE_FILE);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const state = {
      lastAvatarFileName: lastAvatarPath ? path.basename(lastAvatarPath) : null,
      lastChangeTimestamp,
      rateLimitUntil
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error(`[AvatarManager] Error al guardar estado:`, error.message);
  }
}

function loadAvatarFiles() {
  try {
    if (!fs.existsSync(AVATARS_DIR)) {
      console.warn(`[AvatarManager] Directorio no encontrado: ${AVATARS_DIR}`);
      return [];
    }

    const files = fs.readdirSync(AVATARS_DIR);
    const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    
    avatarFiles = files
      .filter(file => {
        const startsWithCapy = file.toLowerCase().startsWith("capy-");
        const hasValidExtension = validExtensions.some(ext => 
          file.toLowerCase().endsWith(ext)
        );
        return startsWithCapy && hasValidExtension;
      })
      .map(file => path.join(AVATARS_DIR, file));

    console.log(`[AvatarManager] Cargados ${avatarFiles.length} avatares`);
    return avatarFiles;
  } catch (error) {
    console.error(`[AvatarManager] Error al cargar avatares:`, error);
    return [];
  }
}

function getRandomAvatar() {
  if (avatarFiles.length === 0) {
    return null;
  }

  if (avatarFiles.length === 1) {
    return avatarFiles[0];
  }

  let selected;
  let attempts = 0;
  const maxAttempts = avatarFiles.length * 2;

  do {
    const randomIndex = Math.floor(Math.random() * avatarFiles.length);
    selected = avatarFiles[randomIndex];
    attempts++;
  } while (selected === lastAvatarPath && attempts < maxAttempts && avatarFiles.length > 1);

  return selected;
}

export async function setRandomAvatar(client) {
  if (!client?.user) {
    console.warn("[AvatarManager] Client o user no disponible");
    return false;
  }

  const now = Date.now();

  if (now < rateLimitUntil) {
    const remainingMinutes = Math.ceil((rateLimitUntil - now) / (60 * 1000));
    console.log(`[AvatarManager] En rate limit backoff. Esperando ${remainingMinutes} minutos más`);
    return false;
  }

  if (now - lastChangeTimestamp < COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((COOLDOWN_MS - (now - lastChangeTimestamp)) / (60 * 1000));
    console.log(`[AvatarManager] En cooldown. Esperando ${remainingMinutes} minutos más`);
    return false;
  }

  if (avatarFiles.length === 0) {
    loadAvatarFiles();
    if (avatarFiles.length === 0) {
      console.warn("[AvatarManager] No hay avatares disponibles");
      return false;
    }
  }

  const avatarPath = getRandomAvatar();
  if (!avatarPath) {
    console.warn("[AvatarManager] No se pudo seleccionar un avatar");
    return false;
  }

  try {
    const avatarBuffer = fs.readFileSync(avatarPath);
    await client.user.setAvatar(avatarBuffer);
    
    lastAvatarPath = avatarPath;
    lastChangeTimestamp = now;
    rateLimitUntil = 0;

    saveState();

    const fileName = path.basename(avatarPath);
    console.log(`[AvatarManager] ✅ Avatar cambiado a: ${fileName}`);
    return true;
  } catch (error) {
    if (error.code === 429 || error.status === 429) {
      rateLimitUntil = now + RATE_LIMIT_BACKOFF_MS;
      saveState();
      const backoffHours = RATE_LIMIT_BACKOFF_MS / (60 * 60 * 1000);
      console.error(`[AvatarManager] ⚠️ Rate limit alcanzado. Deshabilitado por ${backoffHours} horas`);
      return false;
    }

    console.error(`[AvatarManager] Error al cambiar avatar:`, error.message);
    return false;
  }
}

export function startAvatarScheduler(client) {
  const state = loadState();
  lastChangeTimestamp = state.lastChangeTimestamp;
  rateLimitUntil = state.rateLimitUntil;

  if (avatarFiles.length === 0) {
    loadAvatarFiles();
  }

  if (state.lastAvatarFileName) {
    lastAvatarPath = avatarFiles.find(f => path.basename(f) === state.lastAvatarFileName) || null;
    if (lastAvatarPath) {
      const fileName = path.basename(lastAvatarPath);
      console.log(`[AvatarManager] Último avatar cargado desde estado: ${fileName}`);
    } else {
      console.warn(`[AvatarManager] Último avatar guardado (${state.lastAvatarFileName}) no encontrado en archivos disponibles`);
    }
  }

  if (avatarFiles.length === 0) {
    console.warn("[AvatarManager] No se puede iniciar el scheduler: no hay avatares");
    return null;
  }

  console.log(`[AvatarManager] Scheduler iniciado. Intervalo: ${COOLDOWN_MS / (60 * 1000)} minutos`);

  const interval = setInterval(async () => {
    await setRandomAvatar(client);
  }, COOLDOWN_MS);

  setRandomAvatar(client).catch(err => {
    console.error("[AvatarManager] Error en cambio inicial de avatar:", err);
  });

  return interval;
}

export function stopAvatarScheduler(interval) {
  if (interval) {
    clearInterval(interval);
    console.log("[AvatarManager] Scheduler detenido");
  }
}


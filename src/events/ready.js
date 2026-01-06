import { startAvatarScheduler } from "../utils/avatarManager.js";
import { showBanner } from "../utils/consoleBanner.js";
import { startTempbanScheduler } from "../modules/moderation/schedulers/tempban.js";
import { startActivityRotator } from "../utils/activityRotator.js";
import { runAllMigrations } from "../core/db/migrations.js";
import { log } from "../core/logger/index.js";
import { initializeLavalink } from "../modules/music/services/lavalink.service.js";

let avatarInterval = null;

export default async function ready(client) {
  // Ejecutar migraciones automáticamente (solo crea/agrega, nunca elimina datos)
  try {
    await runAllMigrations();
  } catch (error) {
    log.error("Ready", `Error ejecutando migraciones: ${error.message}`);
    // No bloquear el inicio del bot si las migraciones fallan
  }
  showBanner();
  
  const guilds = client.guilds.cache.size;
  const users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const commands = client.application?.commands.cache.size ?? 0;
  const nodeVersion = process.version;
  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    BOT READY                               ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║  Bot Tag:     ${client.user.tag.padEnd(40)} ║`);
  console.log(`║  Bot ID:      ${client.user.id.padEnd(40)} ║`);
  console.log(`║  Servers:     ${String(guilds).padEnd(40)} ║`);
  console.log(`║  Users:       ${String(users).padEnd(40)} ║`);
  console.log(`║  Commands:    ${String(commands).padEnd(40)} ║`);
  console.log(`║  Node.js:     ${nodeVersion.padEnd(40)} ║`);
  console.log(`║  Memory:      ${String(memoryUsage + " MB").padEnd(40)} ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  avatarInterval = startAvatarScheduler(client);
  startTempbanScheduler(client);
  startActivityRotator(client);

  // Inicializar Lavalink (no bloquea - async)
  initializeLavalink(client).then((manager) => {
    if (manager) {
      log.info("Ready", "✅ Lavalink inicializado correctamente");
    } else {
      log.warn("Ready", "⚠️ Lavalink no disponible. El bot continuará sin funcionalidad de música.");
      log.warn("Ready", "Verifica: LAVALINK_HOST, LAVALINK_PORT, LAVALINK_PASSWORD y red Docker.");
    }
  }).catch((error) => {
    log.error("Ready", `❌ Error inicializando Lavalink: ${error.message}`);
    if (error.stack) {
      log.error("Ready", `Stack trace: ${error.stack}`);
    }
    log.warn("Ready", "El bot continuará sin funcionalidad de música. Verifica la configuración de Lavalink.");
  });
}

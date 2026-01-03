/**
 * Entry point principal del bot
 */
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadConfig, getEnv } from "./core/config/index.js";
import { registerEvents, registerProcessHandlers } from "./core/discord/registerEvents.js";
import { log } from "./core/logger/index.js";
import { initRedis } from "./core/redis/index.js";

// Registrar prefix commands de todos los módulos
import { registerModerationPrefixCommands } from "./modules/moderation/commands/prefix.js";
import { registerUtilitiesPrefixCommands } from "./modules/utilities/commands/prefix.js";
import { registerInfoPrefixCommands } from "./modules/info/commands/prefix.js";

async function registerAllPrefixCommands() {
  try {
    await registerModerationPrefixCommands();
    await registerUtilitiesPrefixCommands();
    await registerInfoPrefixCommands();
    log.info("Prefix commands", "Todos los prefix commands registrados correctamente");
  } catch (err) {
    log.error("Prefix commands", "Error registrando prefix commands:", err);
  }
}

registerAllPrefixCommands();

// Cargar y validar configuración
let config;
try {
  config = loadConfig();
} catch (error) {
  log.error("Config", error.message);
  process.exit(1);
}

// Crear cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,    
    GatewayIntentBits.GuildMessages,   
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.GuildMember,
    Partials.User,
    Partials.Message,  
    Partials.Channel   
  ]
});

// Propiedades del cliente
client.commands = new Collection();
client.voiceModMessages = new Map();

// Registrar eventos
registerEvents(client);
registerProcessHandlers(client);

// Inicializar Redis (opcional, no bloquea el inicio si falla)
initRedis().catch((error) => {
  log.warn("Redis", `Redis no disponible: ${error.message}. El bot continuará sin cache.`);
});

// Iniciar sesión
client.login(getEnv("BOT_TOKEN")).catch((error) => {
  log.error("Client", "Error al iniciar sesión:", error.message);
  process.exit(1);
});

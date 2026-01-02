/**
 * Entry point principal del bot
 */
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadConfig, getEnv } from "./core/config/index.js";
import { registerEvents, registerProcessHandlers } from "./core/discord/registerEvents.js";
import { log } from "./core/logger/index.js";

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

// Iniciar sesión
client.login(getEnv("BOT_TOKEN")).catch((error) => {
  log.error("Client", "Error al iniciar sesión:", error.message);
  process.exit(1);
});

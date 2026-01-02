import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { allSlashCommands } from "../modules/registry.js";
import { getConfig } from "../core/config/index.js";

// TODO: Migrar test al registry (solo para guild de pruebas)
const legacyCommands = [];

// allSlashCommands del registry ya incluye: moderation, blacklist, info, permissions, autoroles, settings, utilities
// voice-mod está en moderation/slash.js
// test se mantiene como legacy por ahora (solo para guild de pruebas)
const allCommands = [...allSlashCommands.map(c => c.toJSON()), ...legacyCommands];

// Comando /test solo para guild de pruebas
const testCommand = new SlashCommandBuilder()
  .setName("test")
  .setDescription("🧪 Testea todos los embeds del bot (solo servidor de pruebas)")
  .toJSON();

const TEST_GUILD_ID = "1053040188445704253";

const config = getConfig();
const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const guildId = config.GUILD_ID_PRUEBA;
if (guildId) {
  // Si la guild de prueba configurada es la misma que la de /test, incluir /test en el registro
  if (guildId === TEST_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { 
      body: [...allCommands, testCommand] 
    });
    console.log("Comandos cargados (guild) incluyendo /test.");
  } else {
    // Registrar comandos normales en la guild de prueba configurada
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: allCommands });
    console.log("Comandos cargados (guild).");
    
    // Registrar /test solo en la guild de pruebas específica
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
      body: [testCommand] 
    });
    console.log("Comando /test registrado solo en guild de pruebas.");
  }
} else {
  // Registro global de comandos normales
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: allCommands });
  console.log("Comandos cargados (global). (tardan hasta 1h)");
  
  // Registrar /test solo en la guild de pruebas específica
  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
    body: [testCommand] 
  });
  console.log("Comando /test registrado solo en guild de pruebas.");
}


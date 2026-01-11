import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { allSlashCommands } from "../modules/registry.js";
import { getConfig } from "../core/config/index.js";

const legacyCommands = [];

const allCommands = [...allSlashCommands.map(c => c.toJSON()), ...legacyCommands];

const testCommand = new SlashCommandBuilder()
  .setName("test")
  .setDescription("🧪 Testea todos los embeds del bot (solo servidor de pruebas)")
  .toJSON();

const TEST_GUILD_ID = "1053040188445704253";

const config = getConfig();
const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const guildId = config.GUILD_ID_PRUEBA;
if (guildId) {
  
  if (guildId === TEST_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { 
      body: [...allCommands, testCommand] 
    });
    console.log("Comandos cargados (guild) incluyendo /test.");
  } else {
    
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: allCommands });
    console.log("Comandos cargados (guild).");

    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
      body: [testCommand] 
    });
    console.log("Comando /test registrado solo en guild de pruebas.");
  }
} else {
  
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: allCommands });
  console.log("Comandos cargados (global). (tardan hasta 1h)");

  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
    body: [testCommand] 
  });
  console.log("Comando /test registrado solo en guild de pruebas.");
}

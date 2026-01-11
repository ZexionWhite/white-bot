import { REST, Routes } from "discord.js";
import { getConfig } from "../core/config/index.js";

const config = getConfig();
const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);
const appId = config.CLIENT_ID;
const guildId = config.GUILD_ID_PRUEBA;

async function wipeGuild() {
  if (!guildId) {
    console.error("Set GUILD_ID_PRUEBA in .env to wipe guild commands.");
    process.exit(1);
  }
  await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
  console.log(`✅ Wiped GUILD commands for ${guildId}`);
}

async function wipeGlobal() {
  await rest.put(Routes.applicationCommands(appId), { body: [] });
  console.log("✅ Wiped GLOBAL commands (may take ~1h to disappear everywhere)");
}

const mode = process.argv[2];
const run = async () => {
  if (mode === "guild") return wipeGuild();
  if (mode === "global") return wipeGlobal();
  await wipeGuild().catch(() => {});
  await wipeGlobal().catch(() => {});
};
run().catch(console.error);

// ESM + discord.js v14
import "dotenv/config";
import { REST, Routes } from "discord.js";

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
const appId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID_PRUEBA; // opcional, para limpiar en tu server de pruebas

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

const mode = process.argv[2]; // "guild" | "global" | "both"
const run = async () => {
  if (mode === "guild") return wipeGuild();
  if (mode === "global") return wipeGlobal();
  await wipeGuild().catch(() => {});
  await wipeGlobal().catch(() => {});
};
run().catch(console.error);

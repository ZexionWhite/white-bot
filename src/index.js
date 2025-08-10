import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import ready from "./events/ready.js";
import guildMemberAdd from "./events/guildMemberAdd.js";
import interactionCreate from "./events/interactionCreate.js";
import guildMemberUpdate from "./events/guildMemberUpdate.js";
import guildMemberRemove from "./events/guildMemberRemove.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.GuildMember, Partials.User]
});

client.commands = new Collection();

client.once("ready", () => ready(client));
client.on("guildMemberAdd", (m) => guildMemberAdd(client, m));
client.on("interactionCreate", (i) => interactionCreate(client, i));
client.on("guildMemberUpdate", (oldM, newM) => guildMemberUpdate(client, oldM, newM));
client.on("guildMemberRemove", (m) => guildMemberRemove(client, m));

client.login(process.env.BOT_TOKEN);

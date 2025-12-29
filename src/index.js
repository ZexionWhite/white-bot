import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import ready from "./events/ready.js";
import guildMemberAdd from "./events/guildMemberAdd.js";
import interactionCreate from "./events/interactionCreate.js";
import guildMemberUpdate from "./events/guildMemberUpdate.js";
import guildMemberRemove from "./events/guildMemberRemove.js";
import messageCreate from "./events/messageCreate.js";
import messageDelete from "./events/messageDelete.js";
import messageUpdate from "./events/messageUpdate.js";
import userUpdate from "./events/userUpdate.js";
import voiceStateUpdate from "./events/voiceStateUpdate.js";

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

client.commands = new Collection();
// Almacenar referencias de mensajes de moderación de voz: channelId -> { messageId, channelId, guildId }
client.voiceModMessages = new Map();

client.once("ready", () => ready(client));
client.on("guildMemberAdd", (m) => guildMemberAdd(client, m));
client.on("interactionCreate", (i) => interactionCreate(client, i));
client.on("guildMemberUpdate", (oldM, newM) => guildMemberUpdate(client, oldM, newM));
client.on("guildMemberRemove", (m) => guildMemberRemove(client, m));
client.on("messageCreate", (m) => messageCreate(client, m));
client.on("messageDelete", (m) => messageDelete(client, m));
client.on("messageUpdate", (oldM, newM) => messageUpdate(client, oldM, newM));
client.on("userUpdate", (oldU, newU) => userUpdate(client, oldU, newU));
client.on("voiceStateUpdate", (oldState, newState) => voiceStateUpdate(client, oldState, newState));

client.login(process.env.BOT_TOKEN);

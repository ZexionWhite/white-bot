import { SlashCommandBuilder } from "discord.js";

export const infoSlashCommands = [
  new SlashCommandBuilder()
    .setName("user")
    .setDescription("Detailed information about a user")
    .addUserOption(o => o.setName("user").setDescription("User to view information for"))
];

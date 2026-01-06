import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const utilitiesSlashCommands = [
  new SlashCommandBuilder()
    .setName("preview")
    .setDescription("Preview embed messages")
    .addSubcommand(sc =>
      sc.setName("boost")
       .setDescription("Preview the boost embed")
       .addUserOption(o =>
         o.setName("user")
          .setDescription("Member to simulate (optional)")
       )
       .addBooleanOption(o =>
         o.setName("public")
          .setDescription("Send to channel (if false, sends as ephemeral)")
       )
       .addIntegerOption(o =>
         o.setName("boosts")
          .setDescription("Force boost count (optional)")
          .setMinValue(0)
       )
    )
    .addSubcommand(sc =>
      sc.setName("welcome")
       .setDescription("Preview the welcome embed")
       .addUserOption(o =>
         o.setName("user")
          .setDescription("Member to simulate (optional)")
       )
       .addBooleanOption(o =>
         o.setName("public")
          .setDescription("Send to channel (if false, sends as ephemeral)")
       )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency and status")
    .addBooleanOption(o =>
      o.setName("public")
       .setDescription("If true, shows in channel (default: ephemeral)")
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("View help information and available commands"),

  new SlashCommandBuilder()
    .setName("config")
    .setDescription("View current server configuration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles)
];

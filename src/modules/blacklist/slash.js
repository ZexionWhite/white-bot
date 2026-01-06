import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const blacklistSlashCommands = [
  new SlashCommandBuilder()
    .setName("setblacklistchannel")
    .setDescription("Set the blacklist log channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o => o.setName("channel").setDescription("Channel for blacklist logs").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Manage the server blacklist")
    .addSubcommand(sc =>
      sc.setName("add")
       .setDescription("Add a user to the blacklist")
       .addUserOption(o => o.setName("user").setDescription("User to blacklist").setRequired(true))
       .addStringOption(o => o.setName("severity").setDescription("Severity level").addChoices(
         { name: "Low", value: "LOW" },
         { name: "Medium", value: "MEDIUM" },
         { name: "High", value: "HIGH" },
         { name: "Critical", value: "CRITICAL" }
       ))
       .addAttachmentOption(o => o.setName("evidence").setDescription("Evidence file (optional)").setRequired(false))
    )
    .addSubcommand(sc =>
      sc.setName("history")
       .setDescription("View a user's blacklist history")
       .addUserOption(o => o.setName("user").setDescription("User to view history for").setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName("edit")
       .setDescription("Edit a blacklist entry")
       .addIntegerOption(o => o.setName("caseid").setDescription("Entry ID").setRequired(true))
       .addStringOption(o => o.setName("newseverity").setDescription("New severity").addChoices(
         { name: "Low", value: "LOW" },
         { name: "Medium", value: "MEDIUM" },
         { name: "High", value: "HIGH" },
         { name: "Critical", value: "CRITICAL" }
       ))
    )
    .addSubcommand(sc =>
      sc.setName("remove")
       .setDescription("Remove a blacklist entry")
       .addIntegerOption(o => o.setName("caseid").setDescription("Entry ID").setRequired(true))
       .addStringOption(o => o.setName("reason").setDescription("Reason for removal"))
    )
    .addSubcommand(sc =>
      sc.setName("case")
       .setDescription("View a specific blacklist entry")
       .addIntegerOption(o => o.setName("id").setDescription("Entry ID").setRequired(true))
    )
];


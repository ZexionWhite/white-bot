import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const blacklistSlashCommands = [
  new SlashCommandBuilder()
    .setName("setblacklistchannel")
    .setDescription("Configura el canal de blacklist")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o => o.setName("channel").setDescription("Canal de blacklist").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Gestiona la blacklist")
    .addSubcommand(sc =>
      sc.setName("add")
       .setDescription("Add a user to the blacklist")
       .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
       .addStringOption(o => o.setName("severity").setDescription("Severity").addChoices(
         { name: "Low", value: "LOW" },
         { name: "Medium", value: "MEDIUM" },
         { name: "High", value: "HIGH" },
         { name: "Critical", value: "CRITICAL" }
       ))
    )
    .addSubcommand(sc =>
      sc.setName("history")
       .setDescription("Ver historial de blacklist de un usuario")
       .addUserOption(o => o.setName("user").setDescription("Usuario").setRequired(true))
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
       .setDescription("Eliminar una entrada de blacklist")
       .addIntegerOption(o => o.setName("caseid").setDescription("ID de la entrada").setRequired(true))
       .addStringOption(o => o.setName("reason").setDescription("Razón de eliminación"))
    )
];


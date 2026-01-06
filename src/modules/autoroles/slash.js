import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const autorolesSlashCommands = [
  new SlashCommandBuilder()
    .setName("setupcolors")
    .setDescription("Create and save color roles (some can be booster-only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("color-menu")
    .setDescription("Post or update the color role selection menu")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("config-colors")
    .setDescription("Configure which colors are premium (booster-only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
];

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const autorolesSlashCommands = [
  new SlashCommandBuilder()
    .setName("setupcolors")
    .setDescription("Crea y guarda los roles de colores (algunos pueden ser solo para boosters)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("color-menu")
    .setDescription("Publica/actualiza el mensaje con el menú de selección de color")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
];

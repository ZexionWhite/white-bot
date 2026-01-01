import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const moderationSlashCommands = [
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user")
    .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user")
    .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)")),
  
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user")
    .addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove timeout from a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addIntegerOption(o => o.setName("deletedays").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),
  
  new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Temporarily ban a user")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("Duration (e.g: 10m, 2h, 3d)").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Softban a user (ban and unban immediately)")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("deletedays").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),
  
  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user")
    .addStringOption(o => o.setName("user").setDescription("User ID").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("history")
    .setDescription("Ver historial de sanciones de un usuario")
    .addUserOption(o => o.setName("user").setDescription("Usuario").setRequired(true))
    .addStringOption(o => o.setName("type").setDescription("Tipo de sanción").addChoices(
      { name: "Warn", value: "WARN" },
      { name: "Mute", value: "MUTE" },
      { name: "Timeout", value: "TIMEOUT" },
      { name: "Kick", value: "KICK" },
      { name: "Ban", value: "BAN" }
    ))
    .addIntegerOption(o => o.setName("limit").setDescription("Límite de resultados (1-50)").setMinValue(1).setMaxValue(50)),
  
  new SlashCommandBuilder()
    .setName("case")
    .setDescription("Ver un case específico")
    .addIntegerOption(o => o.setName("id").setDescription("ID del case").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("editcase")
    .setDescription("Edit a case reason")
    .addIntegerOption(o => o.setName("id").setDescription("Case ID").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Eliminar un case")
    .addIntegerOption(o => o.setName("id").setDescription("ID del case").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Razón de eliminación")),
  
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Eliminar mensajes de un canal")
    .addIntegerOption(o => o.setName("amount").setDescription("Cantidad de mensajes (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName("user").setDescription("Usuario específico (opcional)")),
  
  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Bloquear un canal")
    .addChannelOption(o => o.setName("channel").setDescription("Canal a bloquear"))
    .addStringOption(o => o.setName("reason").setDescription("Razón")),
  
  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Desbloquear un canal")
    .addChannelOption(o => o.setName("channel").setDescription("Canal a desbloquear"))
    .addStringOption(o => o.setName("reason").setDescription("Razón")),
  
  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configurar slowmode en un canal")
    .addIntegerOption(o => o.setName("seconds").setDescription("Segundos (0-21600)").setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName("channel").setDescription("Canal")),
  
  new SlashCommandBuilder()
    .setName("createmuterole")
    .setDescription("Crea y configura un rol de mute")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  new SlashCommandBuilder()
    .setName("setmuterole")
    .setDescription("Configura qué rol usar como mute")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o.setName("role").setDescription("Rol de mute").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("setmodlog")
    .setDescription("Configura el canal de modlog")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(o => o.setName("channel").setDescription("Canal de modlog").setRequired(true))
];


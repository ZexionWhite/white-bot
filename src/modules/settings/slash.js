import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ApplicationCommandOptionType } from "discord.js";

export const settingsSlashCommands = [
  new SlashCommandBuilder()
    .setName("set")
    .setDescription("Configuración del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc =>
      sc.setName("welcome")
       .setDescription("Define el canal de bienvenida")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de bienvenida")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
       .addIntegerOption(o =>
         o.setName("cooldown")
          .setDescription("Cooldown en minutos (opcional, default: 60)")
          .setMinValue(0)
       )
    )
    .addSubcommand(sc =>
      sc.setName("join-log")
       .setDescription("Define el canal de logs de ingresos")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de logs")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("message-log")
       .setDescription("Define el canal para logs de mensajes (delete/edit)")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de logs de mensajes")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("avatar-log")
       .setDescription("Define el canal para logs de cambios de avatar")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de logs de avatares")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("nickname-log")
       .setDescription("Define el canal para logs de cambios de apodo")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de logs de apodos")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("voice-log")
       .setDescription("Define el canal para logs de estados de voz (join/leave/move)")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de logs de voz")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("boost-channel")
       .setDescription("Define el canal donde anunciar boosts")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de anuncios de boosters")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("info-channel")
       .setDescription("Define el canal para información/perks del servidor")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de info/perks")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("booster-role")
       .setDescription("Define el rol que identifica boosters")
       .addRoleOption(o =>
         o.setName("rol")
          .setDescription("Rol de boosters")
          .setRequired(true)
       )
    )
    .addSubcommand(sc =>
      sc.setName("prefix")
       .setDescription("Configura el prefijo de comandos del servidor")
       .addStringOption(o =>
         o.setName("prefijo")
          .setDescription("Nuevo prefijo (ej: '!', 'capy!', 'bot.')")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(10)
       )
    ),
  new SlashCommandBuilder()
    .setName("locale")
    .setDescription("Configure the server language")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o =>
      o.setName("language")
       .setDescription("Language to use for this server")
       .setRequired(true)
       .addChoices(
         { name: "Español", value: "es-ES" },
         { name: "English", value: "en-US" }
       )
    )
];

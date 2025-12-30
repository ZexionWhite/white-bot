import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const commands = [
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
    ),

  new SlashCommandBuilder()
    .setName("setupcolors")
    .setDescription("Crea y guarda los roles de colores (algunos pueden ser solo para boosters)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("color-menu")
    .setDescription("Publica/actualiza el mensaje con el menú de selección de color")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("preview")
    .setDescription("Previsualiza embeds (boost, bienvenida, etc.)")
    .addSubcommand(sc =>
      sc.setName("boost")
       .setDescription("Previsualiza el embed de boost")
       .addUserOption(o =>
         o.setName("usuario").setDescription("Miembro a simular (opcional)")
       )
       .addBooleanOption(o =>
         o.setName("publico").setDescription("Envíalo al canal (si no, es ephemeral)")
       )
       .addIntegerOption(o =>
         o.setName("boosts").setDescription("Forzar cantidad de boosts (opcional)").setMinValue(0)
       )
    )
    .addSubcommand(sc =>
      sc.setName("welcome")
       .setDescription("Previsualiza el embed de bienvenida")
       .addUserOption(o =>
         o.setName("usuario").setDescription("Miembro a simular (opcional)")
       )
       .addBooleanOption(o =>
         o.setName("publico").setDescription("Envíalo al canal (si no, es ephemeral)")
       )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Mide latencia y estado del bot")
    .addBooleanOption(o =>
      o.setName("publico")
       .setDescription("Si true, lo muestra en el canal (default: ephemeral)")
    ),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Muestra estadísticas de un usuario (tiempo en voz, mensajes, etc.)")
    .addUserOption(o =>
      o.setName("usuario")
       .setDescription("Usuario a consultar (default: tú mismo)")
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra información sobre todos los comandos disponibles"),

  new SlashCommandBuilder()
    .setName("config")
    .setDescription("Muestra la configuración actual del servidor (solo moderadores)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("voice-mod")
    .setDescription("Herramientas de moderación de canales de voz")
    .addSubcommand(sc =>
      sc.setName("channel")
       .setDescription("Modera usuarios en un canal de voz")
       .addChannelOption(o =>
         o.setName("canal")
          .setDescription("Canal de voz a moderar (opcional, usa el canal actual si no se especifica)")
          .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
       )
    )
    .addSubcommand(sc =>
      sc.setName("user")
       .setDescription("Modera un usuario específico en voz")
       .addUserOption(o =>
         o.setName("usuario")
          .setDescription("Usuario a moderar")
          .setRequired(true)
       )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers | PermissionFlagsBits.MoveMembers),

].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

const guildId = process.env.GUILD_ID_PRUEBA;
if (guildId) {
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands });
  console.log("Comandos cargados (guild).");
} else {
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log("Comandos cargados (global). (tardan hasta 1h)");
}


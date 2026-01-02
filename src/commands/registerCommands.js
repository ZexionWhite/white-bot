import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { allSlashCommands } from "../modules/registry.js";
import { getConfig } from "../core/config/index.js";

const existingCommands = [
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

const allCommands = [...existingCommands, ...allSlashCommands.map(c => c.toJSON())];

// Comando /test solo para guild de pruebas
const testCommand = new SlashCommandBuilder()
  .setName("test")
  .setDescription("🧪 Testea todos los embeds del bot (solo servidor de pruebas)")
  .toJSON();

const TEST_GUILD_ID = "1053040188445704253";

const config = getConfig();
const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const guildId = config.GUILD_ID_PRUEBA;
if (guildId) {
  // Si la guild de prueba configurada es la misma que la de /test, incluir /test en el registro
  if (guildId === TEST_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { 
      body: [...allCommands, testCommand] 
    });
    console.log("Comandos cargados (guild) incluyendo /test.");
  } else {
    // Registrar comandos normales en la guild de prueba configurada
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, guildId), { body: allCommands });
    console.log("Comandos cargados (guild).");
    
    // Registrar /test solo en la guild de pruebas específica
    await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
      body: [testCommand] 
    });
    console.log("Comando /test registrado solo en guild de pruebas.");
  }
} else {
  // Registro global de comandos normales
  await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: allCommands });
  console.log("Comandos cargados (global). (tardan hasta 1h)");
  
  // Registrar /test solo en la guild de pruebas específica
  await rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, TEST_GUILD_ID), { 
    body: [testCommand] 
  });
  console.log("Comando /test registrado solo en guild de pruebas.");
}


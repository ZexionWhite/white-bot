import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Define el canal de bienvenida")
    .addChannelOption(o =>
      o.setName("canal").setDescription("Canal de bienvenida").addChannelTypes(ChannelType.GuildText).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("setlog")
    .setDescription("Define el canal de logs de ingresos")
    .addChannelOption(o =>
      o.setName("canal").setDescription("Canal de logs").addChannelTypes(ChannelType.GuildText).setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("setboosterrole")
    .setDescription("Define el rol que identifica boosters")
    .addRoleOption(o => o.setName("rol").setDescription("Rol de boosters").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("setupcolors")
    .setDescription("Crea y guarda los roles de colores (algunos pueden ser solo para boosters)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("postautoroles")
    .setDescription("Publica/actualiza el mensaje con el menú de selección de color")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
  .setName("setwelcomecd")
  .setDescription("Define el cooldown del mensaje de bienvenida (en minutos)")
  .addIntegerOption(o =>
    o.setName("minutos")
     .setDescription("Ejemplo: 60")
     .setRequired(true)
     .setMinValue(0)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
  .setName("setboostchannel")
  .setDescription("Define el canal donde anunciar boosts")
  .addChannelOption(o =>
    o.setName("canal")
     .setDescription("Canal de anuncios de boosters")
     .addChannelTypes(ChannelType.GuildText)
     .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
  .setName("previewboost")
  .setDescription("Previsualiza el embed de boost sin boostear de verdad")
  .addUserOption(o =>
    o.setName("usuario").setDescription("Miembro a simular (opcional)")
  )
  .addBooleanOption(o =>
    o.setName("publico").setDescription("Envíalo al canal (si no, es ephemeral)")
  )
  .addIntegerOption(o =>
    o.setName("boosts").setDescription("Forzar cantidad de boosts (opcional)").setMinValue(0)
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
  .setName("setinfochannel")
  .setDescription("Set the channel for server info/perks")
  .addChannelOption(o =>
    o.setName("channel")
     .setDescription("Info/perks channel")
     .addChannelTypes(ChannelType.GuildText)
     .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
  .setName("setmessagelog")
  .setDescription("Define the channel for message delete/edit logs")
  .addChannelOption(o =>
    o.setName("channel")
     .setDescription("Log channel for message events")
     .addChannelTypes(ChannelType.GuildText)
     .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

new SlashCommandBuilder()
  .setName("setavatarlog")
  .setDescription("Define the channel for avatar change logs")
  .addChannelOption(o =>
    o.setName("channel")
     .setDescription("Log channel for avatar updates")
     .addChannelTypes(ChannelType.GuildText)
     .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
  .setName("setnicklog")
  .setDescription("Define el canal para logs de cambios de apodo")
  .addChannelOption(o =>
    o.setName("channel")
     .setDescription("Canal de logs de apodos")
     .addChannelTypes(ChannelType.GuildText)
     .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),



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

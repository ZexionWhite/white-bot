import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const utilitiesSlashCommands = [
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild | PermissionFlagsBits.ManageRoles)
];

import { PermissionFlagsBits, ChannelType } from "discord.js";
import * as PermService from "../services/permissions.service.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const channel = itx.options.getChannel("channel") || itx.channel;
  const seconds = itx.options.getInteger("seconds", true);

  if (seconds < 0 || seconds > 21600) {
    return itx.reply({ embeds: [createErrorEmbed("Los segundos deben estar entre 0 y 21600 (6 horas)")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "slowmode")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  if (channel.type !== ChannelType.GuildText) {
    return itx.reply({ embeds: [createErrorEmbed("Este comando solo funciona en canales de texto")], ephemeral: true });
  }

  if (!channel.permissionsFor(itx.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
    return itx.reply({ embeds: [createErrorEmbed("El bot no tiene permisos para gestionar este canal")], ephemeral: true });
  }

  try {
    await channel.setRateLimitPerUser(seconds, "Slowmode configurado");

    return itx.reply({ embeds: [createSuccessEmbed(`Slowmode de ${seconds}s configurado en ${channel}`, { id: channel.id })] });
  } catch (error) {
    console.error("[slowmode] Error:", error);
    return itx.reply({ embeds: [createErrorEmbed(error.message)], ephemeral: true });
  }
}


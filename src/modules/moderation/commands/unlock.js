import { PermissionFlagsBits } from "discord.js";
import * as PermService from "../services/permissions.service.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const channel = itx.options.getChannel("channel") || itx.channel;
  const reason = itx.options.getString("reason") || "Sin razón especificada";

  if (!await PermService.canExecuteCommand(itx.member, "unlock")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  if (!channel.permissionsFor(itx.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
    return itx.reply({ embeds: [createErrorEmbed("El bot no tiene permisos para gestionar este canal")], ephemeral: true });
  }

  try {
    await channel.permissionOverwrites.edit(itx.guild.roles.everyone, {
      SendMessages: null,
      AddReactions: null
    }, { reason });

    return itx.reply({ embeds: [createSuccessEmbed(`Canal ${channel} desbloqueado`, { id: channel.id })] });
  } catch (error) {
    console.error("[unlock] Error:", error);
    return itx.reply({ embeds: [createErrorEmbed(error.message)], ephemeral: true });
  }
}


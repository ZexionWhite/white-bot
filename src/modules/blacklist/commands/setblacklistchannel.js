import { PermissionFlagsBits, ChannelType } from "discord.js";
import * as SettingsRepo from "../../moderation/db/settings.repo.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  if (!itx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return itx.reply({ embeds: [createErrorEmbed("Necesitas el permiso 'Gestionar Servidor'")], ephemeral: true });
  }

  const channel = itx.options.getChannel("channel", true);

  if (channel.type !== ChannelType.GuildText) {
    return itx.reply({ embeds: [createErrorEmbed("El canal debe ser de texto")], ephemeral: true });
  }

  await SettingsRepo.updateGuildSettings(itx.guild.id, { blacklist_channel_id: channel.id });

  return itx.reply({ embeds: [createSuccessEmbed(`Canal de blacklist configurado: ${channel}`)] });
}


import { PermissionFlagsBits, ChannelType } from "discord.js";
import * as PermService from "../services/permissions.service.js";
import * as CasesService from "../services/cases.service.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
  }

  const amount = itx.options.getInteger("amount", true);
  const targetUser = itx.options.getUser("user");

  if (amount < 1 || amount > 100) {
    return itx.reply({ embeds: [createErrorEmbed("La cantidad debe estar entre 1 y 100")], ephemeral: true });
  }

  if (!await PermService.canExecuteCommand(itx.member, "clear")) {
    return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
  }

  const channel = itx.channel;
  if (channel.type !== ChannelType.GuildText) {
    return itx.reply({ embeds: [createErrorEmbed("Este comando solo funciona en canales de texto")], ephemeral: true });
  }

  try {
    let deletedCount = 0;
    let lastMessageId = itx.id;

    if (targetUser) {
      let fetched;
      do {
        fetched = await channel.messages.fetch({ limit: Math.min(amount - deletedCount, 100), before: lastMessageId });
        const toDelete = fetched.filter(m => m.author.id === targetUser.id && !m.pinned);
        if (toDelete.size > 0) {
          await channel.bulkDelete(toDelete, true);
          deletedCount += toDelete.size;
        }
        if (fetched.size > 0) {
          lastMessageId = fetched.last().id;
        }
      } while (deletedCount < amount && fetched.size > 0);
    } else {
      const messages = await channel.messages.fetch({ limit: amount + 1 });
      const toDelete = messages.filter(m => !m.pinned && m.id !== itx.id);
      if (toDelete.size > 0) {
        await channel.bulkDelete(toDelete, true);
        deletedCount = toDelete.size;
      }
    }

    const case_ = CasesService.createCase(
      itx.guild.id,
      "CLEAR",
      targetUser?.id || "ALL",
      itx.user.id,
      `Purge de ${deletedCount} mensajes en ${channel.name}`,
      null,
      { deletedCount, channelId: channel.id, channelName: channel.name }
    );

    return itx.reply({ embeds: [createSuccessEmbed(`Se eliminaron ${deletedCount} mensajes`, targetUser || { id: "ALL" }, case_.id)], ephemeral: true });
  } catch (error) {
    console.error("[clear] Error:", error);
    return itx.reply({ embeds: [createErrorEmbed(error.message)], ephemeral: true });
  }
}


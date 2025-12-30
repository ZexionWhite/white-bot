import { PermissionFlagsBits } from "discord.js";
import { voiceModEmbed, createVoiceModComponents } from "../../utils/embeds.js";

export default async function handleVoiceMod(client, itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
      !itx.memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
    return itx.reply({ 
      content: "❌ No tienes permisos. Se requiere `MuteMembers` o `MoveMembers`.", 
      ephemeral: true 
    });
  }

  const subcommand = itx.options.getSubcommand();
  
  if (subcommand === "channel" || subcommand === "voicechat") {
    let targetChannel = itx.options.getChannel("canal");
    
    if (!targetChannel) {
      const moderatorVoiceState = itx.member.voice;
      if (moderatorVoiceState?.channel) {
        targetChannel = moderatorVoiceState.channel;
      } else {
        return itx.reply({ 
          content: "❌ No especificaste un canal y no estás en ningún canal de voz.", 
          ephemeral: true 
        });
      }
    }

    if (!targetChannel.isVoiceBased()) {
      return itx.reply({ 
        content: "❌ El canal especificado no es un canal de voz.", 
        ephemeral: true 
      });
    }

    const memberIds = Array.from(targetChannel.members.keys());
    const refreshedMembers = await Promise.all(
      memberIds.map(id => itx.guild.members.fetch({ user: id, force: true }).catch(() => null))
    );
    const members = refreshedMembers.filter(m => m && m.voice?.channel?.id === targetChannel.id);
    
    if (members.length === 0) {
      return itx.reply({ 
        content: "❌ No hay usuarios en ese canal de voz.", 
        ephemeral: true 
      });
    }

    const embed = voiceModEmbed(targetChannel, members, itx.member, client);
    const components = createVoiceModComponents(targetChannel, members, itx.member, null, client);

    const reply = await itx.reply({ 
      embeds: [embed], 
      components, 
      ephemeral: false,
      fetchReply: true
    });

    const key = `${itx.guild.id}_${targetChannel.id}`;
    client.voiceModMessages.set(key, {
      messageId: reply.id,
      channelId: reply.channel.id,
      guildId: itx.guild.id,
      voiceChannelId: targetChannel.id,
      moderatorId: itx.member.id
    });
  }

  if (subcommand === "user" || subcommand === "voiceuser") {
    const targetUser = itx.options.getUser("usuario", true);
    const targetMember = await itx.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: "❌ No encontré ese usuario en el servidor.", ephemeral: true });
    }

    const targetChannel = targetMember.voice?.channel;
    if (!targetChannel) {
      return itx.reply({ 
        content: `❌ **${targetUser.tag}** no está en ningún canal de voz.`, 
        ephemeral: true 
      });
    }

    const memberIds = Array.from(targetChannel.members.keys());
    const refreshedMembers = await Promise.all(
      memberIds.map(id => itx.guild.members.fetch({ user: id, force: true }).catch(() => null))
    );
    const members = refreshedMembers.filter(m => m && m.voice?.channel?.id === targetChannel.id);
    
    const embed = voiceModEmbed(targetChannel, members, itx.member, client);
    const components = createVoiceModComponents(targetChannel, members, itx.member, targetMember, client);

    const reply = await itx.reply({ 
      embeds: [embed], 
      components, 
      ephemeral: false,
      fetchReply: true
    });

    const key = `${itx.guild.id}_${targetChannel.id}`;
    client.voiceModMessages.set(key, {
      messageId: reply.id,
      channelId: reply.channel.id,
      guildId: itx.guild.id,
      voiceChannelId: targetChannel.id,
      moderatorId: itx.member.id,
      targetMemberId: targetMember.id
    });
  }
}


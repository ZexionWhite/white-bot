import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { voiceModEmbed, createVoiceModComponents } from "./voice/embeds.js";
import { getLocaleForGuild, t } from "../../core/i18n/index.js";

export default async function handleVoiceMod(client, itx) {
  const locale = await getLocaleForGuild(itx.guild);

  if (!itx.memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
      !itx.memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
    return itx.reply({ 
      content: `❌ ${t(locale, "voice.mod.permission_denied_main")}`, 
      flags: MessageFlags.Ephemeral
    });
  }

  const subcommand = itx.options.getSubcommand();
  
  if (subcommand === "channel" || subcommand === "voicechat") {
    let targetChannel = itx.options.getChannel("channel");
    
    if (!targetChannel) {
      const moderatorVoiceState = itx.member.voice;
      if (moderatorVoiceState?.channel) {
        targetChannel = moderatorVoiceState.channel;
      } else {
        return itx.reply({ 
          content: `❌ ${t(locale, "voice.mod.errors.command_guild_only")}`, 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    if (!targetChannel.isVoiceBased()) {
      return itx.reply({ 
        content: `❌ ${t(locale, "voice.mod.errors.not_voice_channel")}`, 
        flags: MessageFlags.Ephemeral
      });
    }

    const memberIds = Array.from(targetChannel.members.keys());
    const refreshedMembers = await Promise.all(
      memberIds.map(id => itx.guild.members.fetch({ user: id, force: true }).catch(() => null))
    );
    const members = refreshedMembers.filter(m => m && m.voice?.channel?.id === targetChannel.id);
    
    if (members.length === 0) {
      return itx.reply({ 
        content: `❌ ${t(locale, "voice.mod.errors.no_users_in_channel")}`, 
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = voiceModEmbed(targetChannel, members, itx.member, client, locale);
    const components = createVoiceModComponents(targetChannel, members, itx.member, null, client, locale);

    await itx.reply({ 
      embeds: [embed], 
      components
    });

    const reply = await itx.fetchReply();

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
    const targetUser = itx.options.getUser("user", true);
    const targetMember = await itx.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.user_not_found_guild")}`, flags: MessageFlags.Ephemeral });
    }

    const targetChannel = targetMember.voice?.channel;
    if (!targetChannel) {
      return itx.reply({ 
        content: `❌ ${t(locale, "voice.mod.errors.user_not_in_voice", { tag: targetUser.tag })}`, 
        flags: MessageFlags.Ephemeral 
      });
    }

    const memberIds = Array.from(targetChannel.members.keys());
    const refreshedMembers = await Promise.all(
      memberIds.map(id => itx.guild.members.fetch({ user: id, force: true }).catch(() => null))
    );
    const members = refreshedMembers.filter(m => m && m.voice?.channel?.id === targetChannel.id);
    
    const embed = voiceModEmbed(targetChannel, members, itx.member, client, locale);
    const components = createVoiceModComponents(targetChannel, members, itx.member, targetMember, client, locale);

    await itx.reply({ 
      embeds: [embed], 
      components
    });

    const reply = await itx.fetchReply();

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

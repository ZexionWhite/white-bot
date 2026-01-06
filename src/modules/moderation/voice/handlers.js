import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { updateVoiceModEmbed } from "./utils.js";
import { log } from "../../../core/logger/index.js";
import { getLocaleForGuild, t } from "../../../core/i18n/index.js";

export async function handleVoiceModComponent(client, itx, customId) {
  // Para select menus, la interacción ya fue deferred en interactionCreate
  // Para botones, podemos usar reply directamente
  const isDeferred = itx.deferred || itx.replied;
  
  if (!itx.guild) {
    const defaultLocale = "es-ES";
    if (isDeferred) {
      return itx.editReply({ content: `❌ ${t(defaultLocale, "voice.mod.errors.guild_only")}` });
    }
    return itx.reply({ 
      content: `❌ ${t(defaultLocale, "voice.mod.errors.guild_only")}`, 
      flags: MessageFlags.Ephemeral
    });
  }

  const locale = await getLocaleForGuild(itx.guild);

  if (!itx.member) {
    if (isDeferred) {
      return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.member_not_found")}` });
    }
    return itx.reply({ 
      content: `❌ ${t(locale, "voice.mod.errors.member_not_found")}`, 
      flags: MessageFlags.Ephemeral
    });
  }

  const memberPermissions = itx.member.permissions;
  if (!memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
      !memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
    if (isDeferred) {
      return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.permission_denied")}` });
    }
    return itx.reply({ 
      content: `❌ ${t(locale, "voice.mod.errors.permission_denied")}`, 
      flags: MessageFlags.Ephemeral
    });
  }

  if (customId.startsWith("mod_refresh_")) {
    const channelId = customId.replace("mod_refresh_", "");
    await updateVoiceModEmbed(client, channelId, itx.guild.id);
    if (isDeferred) {
      return; // Ya fue deferred, no necesitamos hacer nada más
    }
    return itx.deferUpdate();
  }

  if (customId.startsWith("mod_join_")) {
    const channelId = customId.replace("mod_join_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    try {
      await itx.member.voice.setChannel(channel);
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      if (isDeferred) {
        return; // Ya fue deferred, no necesitamos hacer nada más
      }
      return itx.deferUpdate();
    } catch (error) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.move_failed")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.move_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("mod_bring_") && !customId.includes("_all_")) {
    const userId = customId.replace("mod_bring_", "");
    const targetMember = await itx.guild.members.fetch(userId).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.user_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    const moderatorChannel = itx.member.voice?.channel;
    if (!moderatorChannel) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.not_in_voice")}`, flags: MessageFlags.Ephemeral });
    }

    const oldChannelId = targetMember.voice.channel?.id;

    try {
      await targetMember.voice.setChannel(moderatorChannel);
      if (oldChannelId) await updateVoiceModEmbed(client, oldChannelId, itx.guild.id);
      await updateVoiceModEmbed(client, moderatorChannel.id, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.move_user_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("mod_bring_all_")) {
    const channelId = customId.replace("mod_bring_all_", "");
    const sourceChannel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!sourceChannel?.isVoiceBased()) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    const moderatorChannel = itx.member.voice?.channel;
    if (!moderatorChannel) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.not_in_voice")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.not_in_voice")}`, flags: MessageFlags.Ephemeral });
    }

    const members = Array.from(sourceChannel.members?.values() || []);
    if (members.length === 0) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.no_users")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.no_users")}`, flags: MessageFlags.Ephemeral });
    }

    const nonMods = members.filter(m => 
      m && 
      !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
      m.id !== itx.guild.ownerId
    );

    if (nonMods.length === 0) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.no_non_mods")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.no_non_mods")}`, flags: MessageFlags.Ephemeral });
    }

    try {
      await Promise.all(nonMods.map(m => m?.voice?.setChannel(moderatorChannel).catch(() => null)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      if (moderatorChannel.id !== channelId) await updateVoiceModEmbed(client, moderatorChannel.id, itx.guild.id);
      if (isDeferred) {
        return; // Ya fue deferred, no necesitamos hacer nada más
      }
      return itx.deferUpdate();
    } catch (error) {
      log.error("voiceModHandlers", `Error al mover usuarios en canal ${channelId}:`, error.message);
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.move_some_failed")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.move_some_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("mod_mute_") && !customId.includes("_all_") && !customId.includes("_unmute_")) {
    const userId = customId.replace("mod_mute_", "");
    const targetMember = await itx.guild.members.fetch(userId).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.user_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    const targetVoiceChannel = targetMember.voice?.channel;
    if (!targetVoiceChannel) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.target_not_in_voice")}`, flags: MessageFlags.Ephemeral });
    }

    const channelId = targetVoiceChannel.id;

    try {
      const newMuteState = !targetMember.voice.serverMute;
      await targetMember.voice.setMute(newMuteState);
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.mute_state_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("mod_mute_all_")) {
    const channelId = customId.replace("mod_mute_all_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    const members = Array.from(channel.members?.values() || []);
    if (members.length === 0) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.no_users")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.no_users")}`, flags: MessageFlags.Ephemeral });
    }

    const nonMods = members.filter(m => 
      m && 
      !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
      m.id !== itx.guild.ownerId &&
      !m.voice?.serverMute
    );

    if (nonMods.length === 0) {
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.all_already_muted")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.all_already_muted")}`, flags: MessageFlags.Ephemeral });
    }

    try {
      await Promise.all(nonMods.map(m => m?.voice?.setMute(true).catch(() => null)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      if (isDeferred) {
        return; // Ya fue deferred, no necesitamos hacer nada más
      }
      return itx.deferUpdate();
    } catch (error) {
      log.error("voiceModHandlers", `Error al mutear usuarios en canal ${channelId}:`, error.message);
      if (isDeferred) {
        return itx.editReply({ content: `❌ ${t(locale, "voice.mod.errors.mute_some_failed")}` });
      }
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.mute_some_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (customId.startsWith("mod_unmute_all_")) {
    const channelId = customId.replace("mod_unmute_all_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.channel_not_found")}`, flags: MessageFlags.Ephemeral });
    }

    const members = Array.from(channel.members?.values() || []);
    if (members.length === 0) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.no_users")}`, flags: MessageFlags.Ephemeral });
    }

    const muted = members.filter(m => m && m.voice?.serverMute);

    if (muted.length === 0) {
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.no_muted")}`, flags: MessageFlags.Ephemeral });
    }

    try {
      await Promise.all(muted.map(m => m?.voice?.setMute(false).catch(() => null)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      log.error("voiceModHandlers", `Error al desmutear usuarios en canal ${channelId}:`, error.message);
      return itx.reply({ content: `❌ ${t(locale, "voice.mod.errors.unmute_some_failed")}`, flags: MessageFlags.Ephemeral });
    }
  }

  // Si no coincide con ningún handler, retornar null para que se maneje en el caller
  return null;
}

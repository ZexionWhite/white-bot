import { PermissionFlagsBits } from "discord.js";
import { updateVoiceModEmbed } from "./utils.js";
import { log } from "../../../core/logger/index.js";

export async function handleVoiceModComponent(client, itx, customId) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
      !itx.memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
    return itx.reply({ 
      content: "❌ No tienes permisos para usar esta acción.", 
      ephemeral: true 
    });
  }

  if (customId.startsWith("mod_refresh_")) {
    const channelId = customId.replace("mod_refresh_", "");
    await updateVoiceModEmbed(client, channelId, itx.guild.id);
    return itx.deferUpdate();
  }

  if (customId.startsWith("mod_join_")) {
    const channelId = customId.replace("mod_join_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      return itx.reply({ content: "❌ Canal no encontrado o inválido.", ephemeral: true });
    }

    try {
      await itx.member.voice.setChannel(channel);
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: "❌ No pude moverte. ¿Estás en un canal de voz?", ephemeral: true });
    }
  }

  if (customId.startsWith("mod_bring_") && !customId.includes("_all_")) {
    const userId = customId.replace("mod_bring_", "");
    const targetMember = await itx.guild.members.fetch(userId).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    const moderatorChannel = itx.member.voice?.channel;
    if (!moderatorChannel) {
      return itx.reply({ content: "❌ No estás en un canal de voz.", ephemeral: true });
    }

    const oldChannelId = targetMember.voice.channel?.id;

    try {
      await targetMember.voice.setChannel(moderatorChannel);
      if (oldChannelId) await updateVoiceModEmbed(client, oldChannelId, itx.guild.id);
      await updateVoiceModEmbed(client, moderatorChannel.id, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: "❌ No pude mover al usuario. Verifica permisos y jerarquía.", ephemeral: true });
    }
  }

  if (customId.startsWith("mod_bring_all_")) {
    const channelId = customId.replace("mod_bring_all_", "");
    const sourceChannel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!sourceChannel?.isVoiceBased()) {
      return itx.reply({ content: "❌ Canal no encontrado.", ephemeral: true });
    }

    const moderatorChannel = itx.member.voice?.channel;
    if (!moderatorChannel) {
      return itx.reply({ content: "❌ No estás en un canal de voz.", ephemeral: true });
    }

    const members = Array.from(sourceChannel.members.values());
    const nonMods = members.filter(m => 
      !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
      m.id !== itx.guild.ownerId
    );

    if (nonMods.length === 0) {
      return itx.reply({ content: "❌ No hay usuarios no-moderadores en ese canal.", ephemeral: true });
    }

    try {
      await Promise.all(nonMods.map(m => m.voice.setChannel(moderatorChannel)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      if (moderatorChannel.id !== channelId) await updateVoiceModEmbed(client, moderatorChannel.id, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: "❌ No pude mover algunos usuarios. Verifica permisos.", ephemeral: true });
    }
  }

  if (customId.startsWith("mod_mute_") && !customId.includes("_all_") && !customId.includes("_unmute_")) {
    const userId = customId.replace("mod_mute_", "");
    const targetMember = await itx.guild.members.fetch(userId).catch(() => null);
    
    if (!targetMember) {
      return itx.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    if (!targetMember.voice.channel) {
      return itx.reply({ content: "❌ El usuario no está en un canal de voz.", ephemeral: true });
    }

    const channelId = targetMember.voice.channel.id;

    try {
      const newMuteState = !targetMember.voice.serverMute;
      await targetMember.voice.setMute(newMuteState);
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: "❌ No pude cambiar el estado de mute. Verifica permisos y jerarquía.", ephemeral: true });
    }
  }

  if (customId.startsWith("mod_mute_all_")) {
    const channelId = customId.replace("mod_mute_all_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      return itx.reply({ content: "❌ Canal no encontrado.", ephemeral: true });
    }

    const members = Array.from(channel.members.values());
    const nonMods = members.filter(m => 
      !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
      m.id !== itx.guild.ownerId &&
      !m.voice.serverMute
    );

    if (nonMods.length === 0) {
      return itx.reply({ content: "❌ Todos los usuarios no-moderadores ya están muteados.", ephemeral: true });
    }

    try {
      await Promise.all(nonMods.map(m => m.voice.setMute(true)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      return itx.reply({ content: "❌ No pude mutear algunos usuarios. Verifica permisos.", ephemeral: true });
    }
  }

  if (customId.startsWith("mod_unmute_all_")) {
    const channelId = customId.replace("mod_unmute_all_", "");
    const channel = await itx.guild.channels.fetch(channelId).catch(() => null);
    
    if (!channel?.isVoiceBased()) {
      return itx.reply({ content: "❌ Canal no encontrado.", ephemeral: true });
    }

    const members = Array.from(channel.members.values());
    const muted = members.filter(m => m.voice.serverMute);

    if (muted.length === 0) {
      return itx.reply({ content: "❌ No hay usuarios muteados en ese canal.", ephemeral: true });
    }

    try {
      await Promise.all(muted.map(m => m.voice.setMute(false)));
      await updateVoiceModEmbed(client, channelId, itx.guild.id);
      return itx.deferUpdate();
    } catch (error) {
      log.error("voiceModHandlers", `Error al desmutear usuarios en canal ${channelId}:`, error.message);
      return itx.reply({ content: "❌ No pude desmutear algunos usuarios. Verifica permisos.", ephemeral: true });
    }
  }

  // Si no coincide con ningún handler, retornar null para que se maneje en el caller
  return null;
}

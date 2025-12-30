import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder, ChannelType } from "discord.js";
import db, { getSettings, getColorRoles } from "../db.js";
import { voiceModEmbed, createVoiceModComponents } from "../utils/embeds.js";
import { updateVoiceModEmbed } from "../utils/voiceMod.js";
import * as configModule from "../modules/config/index.js";
import * as moderationModule from "../modules/moderation/index.js";
import * as utilitiesModule from "../modules/utilities/index.js";

export default async function interactionCreate(client, itx) {
  try {
    if (itx.isChatInputCommand()) {
      const name = itx.commandName;
      console.log(`[interactionCreate] Comando ejecutado: ${name} por ${itx.user.tag} en ${itx.guild?.name || "DM"}`);

      if (name === "set") {
        const subcommand = itx.options.getSubcommand();
        
        if (subcommand === "welcome") {
          return configModule.handleSetWelcome(itx);
        }
        if (subcommand === "join-log") {
          return configModule.handleSetJoinLog(itx);
        }
        if (subcommand === "message-log") {
          return configModule.handleSetMessageLog(itx);
        }
        if (subcommand === "avatar-log") {
          return configModule.handleSetAvatarLog(itx);
        }
        if (subcommand === "nickname-log") {
          return configModule.handleSetNicknameLog(itx);
        }
        if (subcommand === "voice-log") {
          return configModule.handleSetVoiceLog(itx);
        }
        if (subcommand === "boost-channel") {
          return configModule.handleSetBoostChannel(itx);
        }
        if (subcommand === "info-channel") {
          return configModule.handleSetInfoChannel(itx);
        }
        if (subcommand === "booster-role") {
          return configModule.handleSetBoosterRole(itx);
        }
      }

      if (name === "setupcolors") {
        const mod = await import("../commands/setupColors.js");
        return mod.default(itx);
      }

      if (name === "color-menu") {
        const mod = await import("../commands/colorMenu.js");
        return mod.default(itx);
      }

      if (name === "preview") {
        return utilitiesModule.handlePreview(itx);
      }

      if (name === "ping") {
        return utilitiesModule.handlePing(itx);
      }

      if (name === "stats") {
        return utilitiesModule.handleStats(itx);
      }

      if (name === "help") {
        return utilitiesModule.handleHelp(itx);
      }

      if (name === "config") {
        return utilitiesModule.handleConfig(itx);
      }

      if (name === "voice-mod") {
        return moderationModule.handleVoiceMod(client, itx);
      }
    }

    if (itx.isStringSelectMenu() && itx.customId === "color-select") {
      await itx.deferReply({ ephemeral: true });

      const cfg = getSettings.get(itx.guild.id);
      const all = getColorRoles.all(itx.guild.id);

      const selectedId = itx.values[0];
      const chosen = all.find(r => r.role_id === selectedId);
      if (!chosen) return itx.editReply({ content: "Opción inválida." });

      const member = await itx.guild.members.fetch(itx.user.id);

      const togglingOff = member.roles.cache.has(selectedId);

      if (!togglingOff && chosen.booster_only) {
        const boosterRoleId = cfg?.booster_role_id;
        const hasBooster = boosterRoleId ? member.roles.cache.has(boosterRoleId) : false;
        if (!hasBooster) return itx.editReply({ content: "Este color es solo para boosters." });
      }

      const paletteIds = new Set(all.map(r => r.role_id));
      const toRemove = member.roles.cache.filter(r => paletteIds.has(r.id) && r.id !== selectedId);

      try {
        await (
          togglingOff
            ? member.roles.remove(selectedId) // quitar si ya lo tiene
            : (async () => {                  // agregar: primero limpiar, luego asignar
                if (toRemove.size) await member.roles.remove([...toRemove.keys()]);
                await member.roles.add(selectedId);
              })()
        );

        return itx.editReply({ content: togglingOff ? "Color quitado ✅" : "Color aplicado ✅" });
      } catch {
        return itx.editReply({ content: "No pude cambiar el rol. Revisá permisos/jerarquía del bot." });
      }
    }

    if (itx.isButton()) {
      const customId = itx.customId;
      
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
          !m.permissions.has(PermissionFlagsBits.MoveMembers)
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
          console.error(`[interactionCreate] Error al desmutear usuarios:`, error.message);
          return itx.reply({ content: "❌ No pude desmutear algunos usuarios. Verifica permisos.", ephemeral: true });
        }
      }
    }

    if (itx.isStringSelectMenu() && itx.customId.startsWith("mod_menu_")) {
      const selectedValue = itx.values[0];
      
      if (!itx.memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
          !itx.memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
        return itx.reply({ 
          content: "❌ No tienes permisos para usar esta acción.", 
          ephemeral: true 
        });
      }

      const fakeItx = {
        ...itx,
        customId: selectedValue,
        isButton: () => true
      };

      const customId = selectedValue;
      
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
          console.error(`[interactionCreate] Error al desmutear usuarios:`, error.message);
          return itx.reply({ content: "❌ No pude desmutear algunos usuarios. Verifica permisos.", ephemeral: true });
        }
      }
    }
  } catch (error) {
    console.error(`[interactionCreate] Error inesperado al procesar interacción:`, error.message);
    if (itx.isRepliable() && !itx.replied && !itx.deferred) {
      itx.reply({ content: "❌ Ocurrió un error al procesar esta interacción.", ephemeral: true }).catch(() => {});
    }
  }
}

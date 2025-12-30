import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder, ChannelType } from "discord.js";
import db, { getSettings, upsertSettings, getColorRoles, getUserStats } from "../db.js";
import { userStatsEmbed, helpEmbed, configEmbed, voiceModEmbed, createVoiceModComponents } from "../utils/embeds.js";
import { updateVoiceModEmbed } from "../utils/voiceMod.js";

export default async function interactionCreate(client, itx) {
  try {
    if (itx.isChatInputCommand()) {
      const name = itx.commandName;
      console.log(`[interactionCreate] Comando ejecutado: ${name} por ${itx.user.tag} en ${itx.guild?.name || "DM"}`);

      if (name === "setwelcome") {
        if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          console.warn(`[interactionCreate] setwelcome: Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
          return itx.reply({ content: "Sin permisos.", ephemeral: true });
        }
        const channel = itx.options.getChannel("canal", true);
        const row = getSettings.get(itx.guild.id) ?? {};
        try {
          upsertSettings.run({
            guild_id: itx.guild.id,
            welcome_channel_id: channel.id,
            log_channel_id: row.log_channel_id ?? null,
            autorole_channel_id: row.autorole_channel_id ?? null,
            autorole_message_id: row.autorole_message_id ?? null,
            booster_role_id: row.booster_role_id ?? null,
            booster_announce_channel_id: row.booster_announce_channel_id ?? null,
            welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
            info_channel_id: row.info_channel_id ?? null,
            message_log_channel_id: row.message_log_channel_id ?? null,
            avatar_log_channel_id: row.avatar_log_channel_id ?? null,
            nickname_log_channel_id: row.nickname_log_channel_id ?? null,
            voice_log_channel_id: row.voice_log_channel_id ?? null
          });
          console.log(`[interactionCreate] setwelcome: Canal configurado a ${channel.name} (${channel.id}) en ${itx.guild.name}`);
        } catch (err) {
          console.error(`[interactionCreate] setwelcome: Error al guardar configuración:`, err.message);
        }
        return itx.reply({ content: `Canal de bienvenida seteado a <#${channel.id}>`, ephemeral: true });
      }

    if (name === "setlog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        console.warn(`[interactionCreate] setlog: Sin permisos - ${itx.user.tag} en ${itx.guild.name}`);
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const channel = itx.options.getChannel("canal", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      try {
        upsertSettings.run({
          guild_id: itx.guild.id,
          welcome_channel_id: row.welcome_channel_id ?? null,
          log_channel_id: channel.id,
          autorole_channel_id: row.autorole_channel_id ?? null,
          autorole_message_id: row.autorole_message_id ?? null,
          booster_role_id: row.booster_role_id ?? null,
          booster_announce_channel_id: row.booster_announce_channel_id ?? null,
          welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
          info_channel_id: row.info_channel_id ?? null,
          message_log_channel_id: row.message_log_channel_id ?? null,
          avatar_log_channel_id: row.avatar_log_channel_id ?? null,
          nickname_log_channel_id: row.nickname_log_channel_id ?? null,
          voice_log_channel_id: row.voice_log_channel_id ?? null
        });
        console.log(`[interactionCreate] setlog: Canal configurado a ${channel.name} (${channel.id}) en ${itx.guild.name}`);
      } catch (err) {
        console.error(`[interactionCreate] setlog: Error al guardar configuración:`, err.message);
      }
      return itx.reply({ content: `Canal de logs seteado a <#${channel.id}>`, ephemeral: true });
    }

    if (name === "setboosterrole") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) return itx.reply({ content: "Sin permisos.", ephemeral: true });
      const role = itx.options.getRole("rol", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: role.id,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
        info_channel_id: row.info_channel_id ?? null,
        message_log_channel_id: row.message_log_channel_id ?? null,
        avatar_log_channel_id: row.avatar_log_channel_id ?? null,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Rol de boosters seteado a **@${role.name}**`, ephemeral: true });
    }

    if (name === "setupcolors") {
      const mod = await import("../commands/setupcolors.js");
      return mod.default(itx);
    }

    if (name === "postautoroles") {
      const mod = await import("../commands/postautoroles.js");
      return mod.default(itx);
    }

    if (name === "setwelcomecd") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const min = itx.options.getInteger("minutos", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: min,
        info_channel_id: row.info_channel_id ?? null,
        message_log_channel_id: row.message_log_channel_id ?? null,
        avatar_log_channel_id: row.avatar_log_channel_id ?? null,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Cooldown de welcome fijado en **${min} min**.`, ephemeral: true });
    }

    if (name === "setboostchannel") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("canal", true);
      const row = getSettings.get(itx.guild.id) ?? {};

      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: ch.id,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
        info_channel_id: row.info_channel_id ?? null,
        message_log_channel_id: row.message_log_channel_id ?? null,
        avatar_log_channel_id: row.avatar_log_channel_id ?? null,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });

      return itx.reply({ content: `Canal de boosters seteado a <#${ch.id}>`, ephemeral: true });
    }

    if (name === "setmessagelog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("channel", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
        info_channel_id: row.info_channel_id ?? null,
        message_log_channel_id: ch.id,
        avatar_log_channel_id: row.avatar_log_channel_id ?? null,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Message log channel set to <#${ch.id}>`, ephemeral: true });
    }

    if (name === "setavatarlog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("channel", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
        info_channel_id: row.info_channel_id ?? null,
        message_log_channel_id: row.message_log_channel_id ?? null,
        avatar_log_channel_id: ch.id,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Avatar log channel set to <#${ch.id}>`, ephemeral: true });
    }

    if (name === "preview") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }

      const subcommand = itx.options.getSubcommand();
      const { welcomeEmbed, boosterEmbed } = await import("../utils/embeds.js");
      const { getSettings } = await import("../db.js");

      const targetUser = itx.options.getUser("usuario") ?? itx.user;
      const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) return itx.reply({ content: "No encontré ese miembro.", ephemeral: true });

      const publico = itx.options.getBoolean("publico") ?? false;

      if (subcommand === "boost") {
        const embed = boosterEmbed(member, {
          boosterRoleId: getSettings.get(itx.guild.id)?.booster_role_id ?? null,
          infoChannelId: getSettings.get(itx.guild.id)?.info_channel_id ?? null
        });

        const forced = itx.options.getInteger("boosts");
        if (forced !== null) {
          const when = new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Cordoba"
          }).format(new Date());
          embed.setFooter({
            text: `${forced} boosts actuales • ${when}`,
            iconURL: member.guild.iconURL({ size: 64, extension: "png" }) ?? undefined
          });
        }

        if (!publico) {
          return itx.reply({ embeds: [embed], ephemeral: true });
        }

        const cfg = getSettings.get(itx.guild.id);
        let ch = null;
        if (cfg?.booster_announce_channel_id) {
          ch = await itx.guild.channels.fetch(cfg.booster_announce_channel_id).catch(() => null);
        }
        if (!ch?.isTextBased()) ch = itx.channel;

        await ch.send({ embeds: [embed] }).catch(() => { });
        return itx.reply({ content: "Preview de boost enviada ✅", ephemeral: true });
      }

      if (subcommand === "welcome") {
        const cfg = getSettings.get(itx.guild.id);
        const embed = welcomeEmbed(member, {
          autorolesChannelId: cfg?.autorole_channel_id ?? null
        });

        if (!publico) {
          return itx.reply({ 
            content: `¡Bienvenido/a <@${member.id}>!`,
            embeds: [embed], 
            ephemeral: true 
          });
        }

        const welcomeCh = cfg?.welcome_channel_id 
          ? await itx.guild.channels.fetch(cfg.welcome_channel_id).catch(() => null)
          : null;
        const ch = welcomeCh?.isTextBased() ? welcomeCh : itx.channel;

        await ch.send({ 
          content: `¡Bienvenido/a <@${member.id}>!`,
          embeds: [embed] 
        }).catch(() => { });
        return itx.reply({ content: "Preview de bienvenida enviada ✅", ephemeral: true });
      }
    }

    if (name === "ping") {
      const publico = itx.options.getBoolean("publico") ?? false;

      const t0 = Date.now();
      await itx.deferReply({ ephemeral: !publico });

      const rt = Date.now() - t0;

      const api = Math.round(itx.client.ws.ping);

      let dbMs = null;
      try { const s = Date.now(); db.prepare("SELECT 1").get(); dbMs = Date.now() - s; } catch { }

      const up = process.uptime(); // segs
      const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
      const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024); // MB

      const embed = new EmbedBuilder()
        .setTitle("🏓 Pong")
        .addFields(
          { name: "API (WS)", value: `${api} ms`, inline: true },
          { name: "Round-trip", value: `${rt} ms`, inline: true },
          { name: "DB", value: dbMs !== null ? `${dbMs} ms` : "–", inline: true },
          { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true },
          { name: "Memoria", value: `${mem} MB`, inline: true },
          { name: "Guilds", value: `${itx.client.guilds.cache.size}`, inline: true }
        )
        .setColor(0x5865f2)
        .setTimestamp();

      await itx.editReply({ embeds: [embed] });
    }

    if (name === "setinfochannel") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("channel", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60,
        info_channel_id: ch.id,
        message_log_channel_id: row.message_log_channel_id ?? null,
        avatar_log_channel_id: row.avatar_log_channel_id ?? null,
        nickname_log_channel_id: row.nickname_log_channel_id ?? null,
        voice_log_channel_id: row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Info channel set to <#${ch.id}>`, ephemeral: true });
    }

    if (name === "setnicklog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("channel", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id:          row.welcome_channel_id ?? null,
        log_channel_id:              row.log_channel_id ?? null,
        autorole_channel_id:         row.autorole_channel_id ?? null,
        autorole_message_id:         row.autorole_message_id ?? null,
        booster_role_id:             row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes:          row.welcome_cd_minutes ?? 60,
        info_channel_id:             row.info_channel_id ?? null,
        message_log_channel_id:      row.message_log_channel_id ?? null,
        avatar_log_channel_id:       row.avatar_log_channel_id ?? null,
        nickname_log_channel_id:     ch.id,
        voice_log_channel_id:        row.voice_log_channel_id ?? null
      });
      return itx.reply({ content: `Nickname log channel set to <#${ch.id}>`, ephemeral: true });
    }

    if (name === "setvoicelog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return itx.reply({ content: "Sin permisos.", ephemeral: true });
      }
      const ch = itx.options.getChannel("channel", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id:          row.welcome_channel_id ?? null,
        log_channel_id:              row.log_channel_id ?? null,
        autorole_channel_id:         row.autorole_channel_id ?? null,
        autorole_message_id:         row.autorole_message_id ?? null,
        booster_role_id:             row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes:          row.welcome_cd_minutes ?? 60,
        info_channel_id:             row.info_channel_id ?? null,
        message_log_channel_id:      row.message_log_channel_id ?? null,
        avatar_log_channel_id:       row.avatar_log_channel_id ?? null,
        nickname_log_channel_id:     row.nickname_log_channel_id ?? null,
        voice_log_channel_id:        ch.id
      });
      return itx.reply({ content: `Voice log channel set to <#${ch.id}>`, ephemeral: true });
    }

    if (name === "userstats") {
      await itx.deferReply({ ephemeral: false });

      const targetUser = itx.options.getUser("usuario") ?? itx.user;
      const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!member) {
        return itx.editReply({ content: "No encontré ese usuario en el servidor." });
      }

      const stats = getUserStats.get(itx.guild.id, member.id) ?? null;
      const embed = userStatsEmbed(member, stats);
      await itx.editReply({ embeds: [embed] });
    }

    if (name === "help") {
      const embed = helpEmbed();
      return itx.reply({ embeds: [embed], ephemeral: false });
    }

    if (name === "config") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild) && 
          !itx.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
        return itx.reply({ 
          content: "❌ No tienes permisos para ver la configuración. Se requiere `ManageGuild` o `ManageRoles`.", 
          ephemeral: true 
        });
      }

      const settings = getSettings.get(itx.guild.id) ?? {};
      const embed = configEmbed(itx.guild, settings);
      return itx.reply({ embeds: [embed], ephemeral: true });
    }

    if (name === "mod") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.MuteMembers) && 
          !itx.memberPermissions.has(PermissionFlagsBits.MoveMembers)) {
        return itx.reply({ 
          content: "❌ No tienes permisos. Se requiere `MuteMembers` o `MoveMembers`.", 
          ephemeral: true 
        });
      }

      const subcommand = itx.options.getSubcommand();
      
      if (subcommand === "voicechat") {
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

      if (subcommand === "voiceuser") {
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
          targetMemberId: targetMember.id // Guardar el usuario objetivo para voiceuser
        });
      }
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
  } catch (error) {
    console.error(`[interactionCreate] Error inesperado al procesar interacción:`, error.message);
    if (itx.isRepliable() && !itx.replied && !itx.deferred) {
      itx.reply({ content: "❌ Ocurrió un error al procesar esta interacción.", ephemeral: true }).catch(() => {});
    }
  }
}

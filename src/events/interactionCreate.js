import { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import db, { getSettings, upsertSettings, getColorRoles } from "../db.js";

export default async function interactionCreate(client, itx) {
  // slash commands
  if (itx.isChatInputCommand()) {
    const name = itx.commandName;
    if (name === "setwelcome") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return itx.reply({ content: "Sin permisos.", ephemeral: true });
      const channel = itx.options.getChannel("canal", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: channel.id,
        log_channel_id: row.log_channel_id ?? null,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60
      });
      return itx.reply({ content: `Canal de bienvenida seteado a <#${channel.id}>`, ephemeral: true });
    }

    if (name === "setlog") {
      if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return itx.reply({ content: "Sin permisos.", ephemeral: true });
      const channel = itx.options.getChannel("canal", true);
      const row = getSettings.get(itx.guild.id) ?? {};
      upsertSettings.run({
        guild_id: itx.guild.id,
        welcome_channel_id: row.welcome_channel_id ?? null,
        log_channel_id: channel.id,
        autorole_channel_id: row.autorole_channel_id ?? null,
        autorole_message_id: row.autorole_message_id ?? null,
        booster_role_id: row.booster_role_id ?? null,
        booster_announce_channel_id: row.booster_announce_channel_id ?? null,
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60
      });
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
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60
      });
      return itx.reply({ content: `Rol de boosters seteado a **@${role.name}**`, ephemeral: true });
    }

    if (name === "setupcolors") {
      // crea roles de colores y guarda en DB
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
        welcome_cd_minutes: min
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
        welcome_cd_minutes: row.welcome_cd_minutes ?? 60
    });

    return itx.reply({ content: `Canal de boosters seteado a <#${ch.id}>`, ephemeral: true });
    }

      if (name === "previewboost") {
          if (!itx.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
              return itx.reply({ content: "Sin permisos.", ephemeral: true });
          }

          const targetUser = itx.options.getUser("usuario") ?? itx.user;
          const member = await itx.guild.members.fetch(targetUser.id).catch(() => null);
          if (!member) return itx.reply({ content: "No encontré ese miembro.", ephemeral: true });

          const embed = (await import("../utils/embeds.js")).boosterEmbed(member);

          const forced = itx.options.getInteger("boosts");
          if (forced !== null) {
              const when = new Intl.DateTimeFormat("es-AR", {
                  dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Cordoba"
              }).format(new Date());
              embed.setFooter({ text: `Anunciado el ${when} • ${forced} boosts actuales` });
          }

          const publico = itx.options.getBoolean("publico") ?? false;
          if (!publico) {
              return itx.reply({ embeds: [embed], ephemeral: true });
          }

          const { getSettings } = await import("../db.js");
          const cfg = getSettings.get(itx.guild.id);
          let ch = null;
          if (cfg?.booster_announce_channel_id) {
              ch = await itx.guild.channels.fetch(cfg.booster_announce_channel_id).catch(() => null);
          }
          if (!ch?.isTextBased()) ch = itx.channel;

          await ch.send({ embeds: [embed] }).catch(() => { });
          return itx.reply({ content: "Preview enviada ✅", ephemeral: true });
      }

      if (name === "ping") {
          const publico = itx.options.getBoolean("publico") ?? false;

          const t0 = Date.now();
          await itx.deferReply({ ephemeral: !publico });

          // round-trip
          const rt = Date.now() - t0;

          // API ping (WebSocket)
          const api = Math.round(itx.client.ws.ping);

          // DB ping
          let dbMs = null;
          try { const s = Date.now(); db.prepare("SELECT 1").get(); dbMs = Date.now() - s; } catch { }

          // uptime & mem
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

  }

// select menu
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
    if (!hasBooster) return itx.editReply({ content: "Este color es solo para boosters.", });
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
}

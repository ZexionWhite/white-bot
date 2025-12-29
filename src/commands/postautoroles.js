import { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { getColorRoles, getSettings, upsertSettings } from "../db.js";

export default async function postautoroles(itx) {
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles))
    return itx.reply({ content: "Sin permisos.", ephemeral: true });

  const cfg = getSettings.get(itx.guild.id);
  if (!cfg?.welcome_channel_id) {
    return itx.reply({ content: "Primero configurá canales con /setwelcome y /setlog.", ephemeral: true });
  }

  const colors = getColorRoles.all(itx.guild.id);
  if (!colors.length) {
    return itx.reply({ content: "No hay roles de color. Utiliza /setupcolors.", ephemeral: true });
  }

  const options = colors.slice(0, 25).map(c => ({
    label: c.name + (c.booster_only ? " 💎" : ""),
    value: c.role_id,
    // description: c.booster_only ? "Solo boosters" : "Disponible para todos"
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("color-select")
    .setPlaceholder("Elegí tu color")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  // Embed de cabecera
  const embed = new EmbedBuilder()
    .setTitle("Autoroles de color")
    .setDescription([
      "• Selecciona el color que más se adapte a ti.",
      "• Las opciones que tengan un **💎** son **solo para boosters**."
    ].join("\n"))
    .setColor(0x5865f2)
    .setThumbnail(itx.guild.iconURL({ size: 128 }))
    .setFooter({ text: `${options.length} opciones disponibles` });

  let msg;
  try {
    if (cfg.autorole_channel_id && cfg.autorole_message_id) {
      const ch = await itx.guild.channels.fetch(cfg.autorole_channel_id);
      msg = await ch.messages.fetch(cfg.autorole_message_id);
      await msg.edit({ content: null, embeds: [embed], components: [row] });
    } else {
      const ch = itx.channel;
      msg = await ch.send({ embeds: [embed], components: [row] });
      // guardar ubicación
      const updated = {
        guild_id: itx.guild.id,
        welcome_channel_id: cfg.welcome_channel_id ?? null,
        log_channel_id: cfg.log_channel_id ?? null,
        autorole_channel_id: ch.id,
        autorole_message_id: msg.id,
        booster_role_id: cfg.booster_role_id ?? null,
        booster_announce_channel_id: cfg.booster_announce_channel_id ?? null,
        welcome_cd_minutes: cfg.welcome_cd_minutes ?? 60,
        info_channel_id: cfg.info_channel_id ?? null,
        message_log_channel_id: cfg.message_log_channel_id ?? null,
        avatar_log_channel_id: cfg.avatar_log_channel_id ?? null,
        nickname_log_channel_id: cfg.nickname_log_channel_id ?? null,
        voice_log_channel_id: cfg.voice_log_channel_id ?? null
      };
      upsertSettings.run(updated);
    }
  } catch {
    return itx.reply({ content: "No pude postear/editar el menú. Verificá permisos y canal.", ephemeral: true });
  }

  return itx.reply({ content: "Menú de autoroles publicado/actualizado.", ephemeral: true });
}

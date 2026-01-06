import { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js";
import { getColorRoles, getSettings, upsertSettings } from "../../../db.js";
import { EMOJIS } from "../../../config/emojis.js";
import { getLocaleForGuild, t } from "../../../core/i18n/index.js";

function parseEmojiMarkdown(markdown) {
  if (!markdown || typeof markdown !== "string") return null;
  const match = markdown.match(/^<a?:(\w+):(\d+)>$/);
  if (match) {
    return { id: match[2], name: match[1] };
  }
  return null;
}

export async function handle(itx) {
  const locale = await getLocaleForGuild(itx.guild);
  
  if (!itx.memberPermissions.has(PermissionFlagsBits.ManageRoles))
    return itx.reply({ content: `❌ ${t(locale, "common.autoroles.no_permissions")}`, flags: MessageFlags.Ephemeral });

  const cfg = await getSettings.get(itx.guild.id);
  if (!cfg?.welcome_channel_id) {
    return itx.reply({ content: `❌ ${t(locale, "common.autoroles.channels_not_configured")}`, flags: MessageFlags.Ephemeral });
  }

  const colors = await getColorRoles.all(itx.guild.id);
  if (!colors.length) {
    return itx.reply({ content: `❌ ${t(locale, "common.autoroles.no_color_roles")}`, flags: MessageFlags.Ephemeral });
  }
  
  const boosterEmoji = parseEmojiMarkdown(EMOJIS.BOOST.BOOSTER);
  const options = colors.slice(0, 25).map(c => {
    const option = {
      label: c.name,
      value: c.role_id
    };
    if (c.booster_only && boosterEmoji) {
      option.emoji = boosterEmoji;
    }
    return option;
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("color-select")
    .setPlaceholder("Elegí tu color")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  const embed = new EmbedBuilder()
    .setTitle("Autoroles de color")
    .setDescription([
      "• Selecciona el color que más se adapte a ti.",
      `• Las opciones que tengan un ${EMOJIS.BOOST.BOOSTER} son **solo para boosters**.`
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
      await upsertSettings.run(updated);
    }
  } catch {
    return itx.reply({ content: `❌ ${t(locale, "common.autoroles.menu_post_failed")}`, flags: MessageFlags.Ephemeral });
  }

  return itx.reply({ content: `✅ ${t(locale, "common.autoroles.menu_posted")}`, flags: MessageFlags.Ephemeral });
}

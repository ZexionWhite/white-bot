import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

function parseEmojiMarkdown(markdown, fallback) {
  if (!markdown || typeof markdown !== "string") return fallback;
  const match = markdown.match(/^<a?:(\w+):(\d+)>$/);
  if (match) {
    return { id: match[2], name: match[1] };
  }
  return fallback;
}

export function voiceModEmbed(channel, members, moderator, client = null, locale = DEFAULT_LOCALE) {
  if (!channel || !members || members.length === 0) {
    return new EmbedBuilder()
      .setTitle(t(locale, "voice.mod.embed.empty_title"))
      .setDescription(t(locale, "voice.mod.embed.empty_description"))
      .setColor(0x95a5a6);
  }

  const isModerator = (member) => {
    return member.permissions.has(PermissionFlagsBits.MuteMembers) ||
           member.permissions.has(PermissionFlagsBits.MoveMembers) ||
           member.permissions.has(PermissionFlagsBits.ManageGuild);
  };

  const isOwner = (member) => {
    return member.id === member.guild.ownerId;
  };

  const memberList = members.map((member) => {
    let muteIcon;
    if (member.voice.serverMute) {
      muteIcon = EMOJIS.VOICE?.GUILD_MUTE || "🔇";
    }
    else if (member.voice.selfMute) {
      muteIcon = EMOJIS.VOICE?.LOCAL_MUTED || "🔇";
    } else {
      muteIcon = EMOJIS.VOICE?.UNMUTED || "🔊";
    }
    
    let deafIcon;
    if (member.voice.serverDeaf) {
      deafIcon = EMOJIS.VOICE?.GUILD_DEAFEN || "🔇";
    }
    else if (member.voice.selfDeaf) {
      deafIcon = EMOJIS.VOICE?.LOCAL_DEAFEN || "🔇";
    } else {
      deafIcon = EMOJIS.VOICE?.UNDEAFEN || "🔊";
    }
    
    let roleIcons = "";
    if (isOwner(member)) {
      roleIcons += EMOJIS.ROLES?.OWNER || "👑";
    } else if (isModerator(member)) {
      roleIcons += EMOJIS.ROLES?.STAFF || "🛡️";
    }

    return `${muteIcon}${deafIcon} <@${member.id}> ${roleIcons}`;
  }).join("\n");

  const firstMember = members[0];
  const headerText = t(locale, "voice.mod.embed.header_in_channel", { userId: firstMember.id });

  const embed = new EmbedBuilder()
    .setDescription(`${headerText} <#${channel.id}>\n\n${memberList}`)
    .setColor(0x393a41);

  return embed;
}

export function createVoiceModComponents(channel, members, moderator, targetMember = null, client = null, locale = DEFAULT_LOCALE) {
  const muteEmoji = parseEmojiMarkdown(EMOJIS.VOICE?.GUILD_MUTE, "🔇");
  const unmutedEmoji = parseEmojiMarkdown(EMOJIS.VOICE?.UNMUTED, "🔊");
  const refreshEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.REFRESH, "🔄");
  const moveOutEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.MOVE_OUT, "👥");
  const moveInEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.MOVE_IN, "🔊");

  const menuOptions = [
    {
      label: t(locale, "voice.mod.menu.join_channel"),
      value: `mod_join_${channel.id}`,
      description: t(locale, "voice.mod.menu.join_description"),
      emoji: moveInEmoji
    },
    {
      label: t(locale, "voice.mod.menu.bring_all"),
      value: `mod_bring_all_${channel.id}`,
      description: t(locale, "voice.mod.menu.bring_all_description"),
      emoji: moveOutEmoji
    },
    {
      label: t(locale, "voice.mod.menu.mute_all"),
      value: `mod_mute_all_${channel.id}`,
      description: t(locale, "voice.mod.menu.mute_all_description"),
      emoji: muteEmoji
    },
    {
      label: t(locale, "voice.mod.menu.unmute_all"),
      value: `mod_unmute_all_${channel.id}`,
      description: t(locale, "voice.mod.menu.unmute_all_description"),
      emoji: unmutedEmoji
    },
    {
      label: t(locale, "voice.mod.menu.refresh"),
      value: `mod_refresh_${channel.id}`,
      description: t(locale, "voice.mod.menu.refresh_description"),
      emoji: refreshEmoji
    }
  ];

  if (targetMember && 
      !targetMember.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !targetMember.permissions.has(PermissionFlagsBits.MoveMembers) &&
      targetMember.id !== moderator.guild.ownerId) {
    menuOptions.push({
      label: t(locale, "voice.mod.menu.bring_user", { username: targetMember.user.username }),
      value: `mod_bring_${targetMember.id}`,
      description: t(locale, "voice.mod.menu.bring_user_description", { username: targetMember.user.username }),
      emoji: moveOutEmoji
    });
  }

  const nonMods = members.filter(m => 
    !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
    !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
    m.id !== moderator.guild.ownerId
  );

  nonMods.slice(0, 21).forEach(member => {
    const isServerMuted = member.voice.serverMute;
    menuOptions.push({
      label: isServerMuted 
        ? t(locale, "voice.mod.menu.unmute_user", { username: member.user.username })
        : t(locale, "voice.mod.menu.mute_user", { username: member.user.username }),
      value: `mod_mute_${member.id}`,
      description: isServerMuted
        ? t(locale, "voice.mod.menu.unmute_user_description", { username: member.user.username })
        : t(locale, "voice.mod.menu.mute_user_description", { username: member.user.username }),
      emoji: muteEmoji
    });
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`mod_menu_${channel.id}`)
    .setPlaceholder(t(locale, "voice.mod.menu.placeholder"))
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(menuOptions.slice(0, 25));

  const menuRow = new ActionRowBuilder().addComponents(menu);

  const quickButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`mod_join_${channel.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(moveInEmoji),
      new ButtonBuilder()
        .setCustomId(`mod_mute_all_${channel.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(muteEmoji),
      new ButtonBuilder()
        .setCustomId(`mod_refresh_${channel.id}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(refreshEmoji)
    );

  return [menuRow, quickButtons];
}

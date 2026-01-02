import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { EMOJIS } from "../../../config/emojis.js";

function parseEmojiMarkdown(markdown, fallback) {
  if (!markdown || typeof markdown !== "string") return fallback;
  const match = markdown.match(/^<a?:(\w+):(\d+)>$/);
  if (match) {
    return { id: match[2], name: match[1] };
  }
  return fallback;
}

export function voiceModEmbed(channel, members, moderator, client = null) {
  if (!channel || !members || members.length === 0) {
    return new EmbedBuilder()
      .setTitle("🔇 Canal de voz")
      .setDescription("No hay usuarios en este canal de voz.")
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
  const headerText = `<@${firstMember.id}> está en`;

  const embed = new EmbedBuilder()
    .setDescription(`${headerText} <#${channel.id}>\n\n${memberList}`)
    .setColor(0x393a41);

  return embed;
}

export function createVoiceModComponents(channel, members, moderator, targetMember = null, client = null) {
  const muteEmoji = parseEmojiMarkdown(EMOJIS.VOICE?.GUILD_MUTE, "🔇");
  const unmutedEmoji = parseEmojiMarkdown(EMOJIS.VOICE?.UNMUTED, "🔊");
  const refreshEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.REFRESH, "🔄");
  const moveOutEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.MOVE_OUT, "👥");
  const moveInEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS?.MOVE_IN, "🔊");

  const menuOptions = [
    {
      label: "Moverme al canal",
      value: `mod_join_${channel.id}`,
      description: "Te mueve a este canal de voz",
      emoji: moveInEmoji
    },
    {
      label: "Traer todos a mi canal",
      value: `mod_bring_all_${channel.id}`,
      description: "Mueve todos los usuarios no-mods a tu canal",
      emoji: moveOutEmoji
    },
    {
      label: "Mutear a todos",
      value: `mod_mute_all_${channel.id}`,
      description: "Mutea a todos los usuarios no-moderadores",
      emoji: muteEmoji
    },
    {
      label: "Desmutear a todos",
      value: `mod_unmute_all_${channel.id}`,
      description: "Desmutea a todos los usuarios",
      emoji: unmutedEmoji
    },
    {
      label: "Recargar",
      value: `mod_refresh_${channel.id}`,
      description: "Actualiza la lista de usuarios",
      emoji: refreshEmoji
    }
  ];

  if (targetMember && 
      !targetMember.permissions.has(PermissionFlagsBits.MuteMembers) &&
      !targetMember.permissions.has(PermissionFlagsBits.MoveMembers) &&
      targetMember.id !== moderator.guild.ownerId) {
    menuOptions.push({
      label: `Traer ${targetMember.user.username} a mi canal`,
      value: `mod_bring_${targetMember.id}`,
      description: `Mover ${targetMember.user.username} a tu canal`,
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
      label: `${isServerMuted ? "Desmutear" : "Mutear"} ${member.user.username}`,
      value: `mod_mute_${member.id}`,
      description: `${isServerMuted ? "Desmutear" : "Mutear"} a ${member.user.username}`,
      emoji: muteEmoji
    });
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`mod_menu_${channel.id}`)
    .setPlaceholder("Ver acciones disponibles")
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

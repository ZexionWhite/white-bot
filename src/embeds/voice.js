import { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { TZ } from "../config.js";
import { formatDuration } from "../utils/time.js";
import { EMOJIS } from "../config/emojis.js";

export function voiceStateEmbed(oldState, newState, session = null) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const member = newState.member ?? oldState.member;
  if (!member) return null;

  const username = member.user?.tag ?? member.displayName ?? "Desconocido";
  const userId = member.id ?? "Desconocido";

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const oldChannelId = oldChannel?.id ?? null;
  const newChannelId = newChannel?.id ?? null;

  let eventType, color, title, description, fields = [];

  if (!oldChannel && newChannel) {
    eventType = "join";
    color = 0x2ecc71;
    title = "🔊 Usuario se unió a voz";
    description = `**${username}** (\`${userId}\`) se unió a un canal de voz.`;
    fields.push({
      name: "Canal",
      value: `<#${newChannelId}>`,
      inline: true
    });
  }
  else if (oldChannel && !newChannel) {
    eventType = "leave";
    color = 0xed4245;
    title = "🔇 Usuario salió de voz";
    description = `**${username}** (\`${userId}\`) salió del canal de voz.`;
    fields.push({
      name: "Canal anterior",
      value: `<#${oldChannelId}>`,
      inline: true
    });
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: "Tiempo en canal",
          value: formatDuration(durationSeconds),
          inline: true
        });
      }
    }
  }
  else if (oldChannel && newChannel && oldChannelId !== newChannelId) {
    eventType = "move";
    color = 0xf1c40f;
    title = "🔄 Usuario se movió de canal";
    description = `**${username}** (\`${userId}\`) cambió de canal de voz.`;
    fields.push(
      {
        name: "Desde",
        value: `<#${oldChannelId}>`,
        inline: true
      },
      {
        name: "Hacia",
        value: `<#${newChannelId}>`,
        inline: true
      }
    );
    
    if (session) {
      const now = Date.now();
      const durationSeconds = Math.floor((now - session.join_timestamp) / 1000);
      if (durationSeconds > 0) {
        fields.push({
          name: "Tiempo en canal anterior",
          value: formatDuration(durationSeconds),
          inline: true
        });
      }
    }
  }
  else {
    return null;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .addFields(fields)
    .setTimestamp()
    .setFooter({
      text: `Voice state update • ${when}`,
      iconURL: member.guild?.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  if (member.user) {
    embed.setThumbnail(member.user.displayAvatarURL({ size: 128 }));
  }

  return embed;
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
      muteIcon = EMOJIS.VOICE.GUILD_MUTE;
    }
    else if (member.voice.selfMute) {
      muteIcon = EMOJIS.VOICE.LOCAL_MUTED;
    } else {
      muteIcon = EMOJIS.VOICE.UNMUTED;
    }
    
    let deafIcon;
    if (member.voice.serverDeaf) {
      deafIcon = EMOJIS.VOICE.GUILD_DEAFEN;
    }
    else if (member.voice.selfDeaf) {
      deafIcon = EMOJIS.VOICE.LOCAL_DEAFEN;
    } else {
      deafIcon = EMOJIS.VOICE.UNDEAFEN;
    }
    
    let roleIcons = "";
    if (isOwner(member)) {
      roleIcons += EMOJIS.ROLES.OWNER;
    } else if (isModerator(member)) {
      roleIcons += EMOJIS.ROLES.STAFF;
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

function parseEmojiMarkdown(markdown, fallback) {
  if (!markdown || typeof markdown !== 'string') return fallback;
  
  const match = markdown.match(/^<a?:(\w+):(\d+)>$/);
  if (match) {
    return { id: match[2], name: match[1] };
  }
  
  return fallback;
}

export function createVoiceModComponents(channel, members, moderator, targetMember = null, client = null) {
  const muteEmoji = parseEmojiMarkdown(EMOJIS.VOICE.GUILD_MUTE, "🔇");
  const unmutedEmoji = parseEmojiMarkdown(EMOJIS.VOICE.UNMUTED, "🔊");
  const refreshEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS.REFRESH, "🔄");
  const moveOutEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS.MOVE_OUT, "👥");
  const moveInEmoji = parseEmojiMarkdown(EMOJIS.ACTIONS.MOVE_IN, "🔊");

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


import { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { TZ, WELCOME_GIF_URL, BOOST_GIF_URL } from "../config.js";
import { formatDuration } from "./time.js";

export function welcomeEmbed(member, {
  gifUrl = WELCOME_GIF_URL,
  autorolesChannelId,
} = {}) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const username =
    member.displayName ??
    member.user.globalName ??
    member.user.username;

  const tip = autorolesChannelId
    ? `• Elegí tu color en <#${autorolesChannelId}>.`
    : "• Pstt... no olvides leer las reglas.";

  return new EmbedBuilder()
    .setTitle(`¡Bienvenido a ${member.guild.name}!`)
    .setDescription(`**${username}**, nos encanta tenerte acá.\n${tip}`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setImage(gifUrl)
    .setColor(0x5865f2)
    .setFooter({ text: `Se unió el ${when}` });
}

export function logJoinEmbed(member) {
  return new EmbedBuilder()
    .setTitle("<:user_joined:1404291903465455809> User joined")
    .setDescription(`**${member.user.tag}** (\`${member.id}\`) joined the guild.`)
    .setTimestamp()
    .setColor(0x95a5a6);
}


export function boosterEmbed(
  member,
  {
    gifUrl = BOOST_GIF_URL,
    boosterRoleId,   
    infoChannelId    
  } = {}
) {
  const when = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ
  }).format(new Date());

  const username =
    member.displayName ?? member.user.globalName ?? member.user.username;

  const boosts = member.guild.premiumSubscriptionCount ?? 0;

  // Rol “Server Booster”: usa el provisto o detecta el automático del server
  const autoBoosterRole = member.guild.roles.cache.find(r => r.tags?.premiumSubscriberRole);
  const roleIdToMention = boosterRoleId ?? autoBoosterRole?.id ?? null;
  const boosterMention = roleIdToMention ? `<@&${roleIdToMention}>` : "Server Booster";

  const descLines = [
    `En agradecimiento por la mejora, se te ha otorgado el rol de ${boosterMention}.`
  ];
  if (infoChannelId) {
    descLines.push(`• Puedes revisar tus ventajas en <#${infoChannelId}>.`);
  }

  return new EmbedBuilder()
    .setTitle(`<:dev_whitebooster:1404272356905713674> ¡**${username}** ha boosteado **${member.guild.name}**!`)
    .setDescription(descLines.join("\n"))
    .setImage(gifUrl)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setColor(0xf47fff)
    .setFooter({
      text: `${when} • ${boosts} boosts actuales`,
      iconURL: member.guild.iconURL({ size: 32, extension: 'png' }) ?? undefined
    });
}

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

  // Determinar tipo de evento
  let eventType, color, title, description, fields = [];

  // JOIN: null → canal
  if (!oldChannel && newChannel) {
    eventType = "join";
    color = 0x2ecc71; // Verde
    title = "🔊 Usuario se unió a voz";
    description = `**${username}** (\`${userId}\`) se unió a un canal de voz.`;
    fields.push({
      name: "Canal",
      value: `<#${newChannelId}>`,
      inline: true
    });
  }
  // LEAVE: canal → null
  else if (oldChannel && !newChannel) {
    eventType = "leave";
    color = 0xed4245; // Rojo
    title = "🔇 Usuario salió de voz";
    description = `**${username}** (\`${userId}\`) salió del canal de voz.`;
    fields.push({
      name: "Canal anterior",
      value: `<#${oldChannelId}>`,
      inline: true
    });
    
    // Agregar tiempo si tenemos la sesión
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
  // MOVE: canal A → canal B
  else if (oldChannel && newChannel && oldChannelId !== newChannelId) {
    eventType = "move";
    color = 0xf1c40f; // Amarillo
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
    
    // Agregar tiempo en canal anterior si tenemos la sesión
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
  // Si no hay cambio relevante, no retornar embed
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

  // Thumbnail del usuario
  if (member.user) {
    embed.setThumbnail(member.user.displayAvatarURL({ size: 128 }));
  }

  return embed;
}

export function userStatsEmbed(member, stats) {
  const username = member.user?.tag ?? member.displayName ?? "Desconocido";
  const userId = member.id ?? "Desconocido";
  
  const voiceTime = stats?.total_voice_seconds ?? 0;
  const messageCount = stats?.message_count ?? 0;
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 Estadísticas de ${username}`)
    .setDescription(`Estadísticas de actividad en **${member.guild.name}**`)
    .setThumbnail(member.user?.displayAvatarURL({ size: 256 }) ?? null)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "⏱️ Tiempo en voz",
        value: formatDuration(voiceTime),
        inline: true
      },
      {
        name: "💬 Mensajes",
        value: messageCount.toLocaleString("es-AR"),
        inline: true
      },
      {
        name: "👤 Usuario",
        value: `<@${userId}>`,
        inline: true
      }
    )
    .setTimestamp()
    .setFooter({
      text: `ID: ${userId}`,
      iconURL: member.guild?.iconURL({ size: 64, extension: "png" }) ?? undefined
    });

  return embed;
}

export function helpEmbed() {
  return new EmbedBuilder()
    .setTitle("📚 Comandos disponibles")
    .setDescription("Lista de todos los comandos del bot y su descripción")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "👋 Bienvenidas",
        value: [
          "`/setwelcome` - Define el canal de bienvenida (Admin)",
          "`/setlog` - Define el canal de logs de ingresos (Admin)",
          "`/setwelcomecd` - Define el cooldown del mensaje de bienvenida (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🎨 Autoroles de color",
        value: [
          "`/setupcolors` - Crea los roles de colores (Admin)",
          "`/postautoroles` - Publica el menú de selección de color (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "💎 Boosters",
        value: [
          "`/setboosterrole` - Define el rol de boosters (Admin)",
          "`/setboostchannel` - Define el canal de anuncios de boost (Admin)",
          "`/preview boost` - Previsualiza el embed de boost (Admin)",
          "`/preview welcome` - Previsualiza el embed de bienvenida (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "📝 Logs",
        value: [
          "`/setmessagelog` - Canal para logs de mensajes (Admin)",
          "`/setavatarlog` - Canal para logs de avatares (Admin)",
          "`/setnicklog` - Canal para logs de apodos (Admin)",
          "`/setvoicelog` - Canal para logs de voz (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "⚙️ Configuración",
        value: [
          "`/setinfochannel` - Canal de información/perks (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "📊 Utilidades",
        value: [
          "`/userstats [usuario]` - Muestra estadísticas de un usuario",
          "`/ping` - Mide latencia y estado del bot",
          "`/help` - Muestra este mensaje",
          "`/config` - Muestra la configuración del servidor (Admin)"
        ].join("\n"),
        inline: false
      },
      {
        name: "🛡️ Moderación",
        value: [
          "`/mod voicechat [canal]` - Modera usuarios en un canal de voz (Mod)",
          "`/mod voiceuser [usuario]` - Modera un usuario específico en voz (Mod)"
        ].join("\n"),
        inline: false
      }
    )
    .setFooter({ text: "Los comandos marcados con (Admin) requieren permisos de administrador" })
    .setTimestamp();
}

export function configEmbed(guild, settings) {
  const fields = [];
  
  // Bienvenidas
  const welcomeCh = settings?.welcome_channel_id 
    ? `<#${settings.welcome_channel_id}>` 
    : "❌ No configurado";
  const logCh = settings?.log_channel_id 
    ? `<#${settings.log_channel_id}>` 
    : "❌ No configurado";
  const welcomeCd = settings?.welcome_cd_minutes ?? 60;
  
  fields.push({
    name: "👋 Bienvenidas",
    value: [
      `**Canal de bienvenida:** ${welcomeCh}`,
      `**Canal de logs:** ${logCh}`,
      `**Cooldown:** ${welcomeCd} minutos`
    ].join("\n"),
    inline: false
  });

  // Autoroles
  const autoroleCh = settings?.autorole_channel_id 
    ? `<#${settings.autorole_channel_id}>` 
    : "❌ No configurado";
  const autoroleMsg = settings?.autorole_message_id 
    ? `[Mensaje](https://discord.com/channels/${guild.id}/${settings.autorole_channel_id}/${settings.autorole_message_id})` 
    : "❌ No publicado";
  
  fields.push({
    name: "🎨 Autoroles de color",
    value: [
      `**Canal:** ${autoroleCh}`,
      `**Mensaje:** ${autoroleMsg}`
    ].join("\n"),
    inline: false
  });

  // Boosters
  const boosterRole = settings?.booster_role_id 
    ? `<@&${settings.booster_role_id}>` 
    : "❌ No configurado";
  const boostCh = settings?.booster_announce_channel_id 
    ? `<#${settings.booster_announce_channel_id}>` 
    : "❌ No configurado";
  const infoCh = settings?.info_channel_id 
    ? `<#${settings.info_channel_id}>` 
    : "❌ No configurado";
  
  fields.push({
    name: "💎 Boosters",
    value: [
      `**Rol de boosters:** ${boosterRole}`,
      `**Canal de anuncios:** ${boostCh}`,
      `**Canal de info:** ${infoCh}`
    ].join("\n"),
    inline: false
  });

  // Logs
  const msgLog = settings?.message_log_channel_id 
    ? `<#${settings.message_log_channel_id}>` 
    : "❌ No configurado";
  const avatarLog = settings?.avatar_log_channel_id 
    ? `<#${settings.avatar_log_channel_id}>` 
    : "❌ No configurado";
  const nickLog = settings?.nickname_log_channel_id 
    ? `<#${settings.nickname_log_channel_id}>` 
    : "❌ No configurado";
  const voiceLog = settings?.voice_log_channel_id 
    ? `<#${settings.voice_log_channel_id}>` 
    : "❌ No configurado";
  
  fields.push({
    name: "📝 Logs",
    value: [
      `**Mensajes:** ${msgLog}`,
      `**Avatares:** ${avatarLog}`,
      `**Apodos:** ${nickLog}`,
      `**Voz:** ${voiceLog}`
    ].join("\n"),
    inline: false
  });

  return new EmbedBuilder()
    .setTitle("⚙️ Configuración del servidor")
    .setDescription(`Configuración actual de **${guild.name}**`)
    .setColor(0x5865f2)
    .addFields(fields)
    .setThumbnail(guild.iconURL({ size: 128 }))
    .setFooter({ text: `ID del servidor: ${guild.id}` })
    .setTimestamp();
}

export function voiceModEmbed(channel, members, moderator, client = null) {
  if (!channel || !members || members.length === 0) {
    return new EmbedBuilder()
      .setTitle("🔇 Canal de voz")
      .setDescription("No hay usuarios en este canal de voz.")
      .setColor(0x95a5a6);
  }

  // Determinar si un usuario es moderador
  const isModerator = (member) => {
    return member.permissions.has(PermissionFlagsBits.MuteMembers) ||
           member.permissions.has(PermissionFlagsBits.MoveMembers) ||
           member.permissions.has(PermissionFlagsBits.ManageGuild);
  };

  // Determinar si es owner
  const isOwner = (member) => {
    return member.id === member.guild.ownerId;
  };

  // Emojis custom en formato markdown
  const UNMUTED_EMOJI = "<:microphone:1455326669803094066>";
  const UNDEAFEN_EMOJI = "<:sound:1455326656959873201>";
  const GUILD_MUTE_EMOJI = "<:guild_mute:1455326680838050004>";
  const GUILD_DEAFEN_EMOJI = "<:guild_deafen:1455326695413256203>";
  const LOCAL_MUTED_EMOJI = "<:local_muted:1455354429522968720>";
  const LOCAL_DEAFEN_EMOJI = "<:local_deafen:1455354439819857970>";
  const STAFF_EMOJI = "<:staff:1455329507623043135>";
  const OWNER_EMOJI = "<:owner:1455329532042022952>";

  // Formatear lista de usuarios
  const memberList = members.map((member) => {
    // Iconos de estado de voz
    // Mute: 3 estados posibles
    const isGuildMuted = member.voice.mute; // Mute de servidor
    const isSelfMuted = member.voice.selfMute; // Mute local (self)
    
    let muteIcon;
    if (isGuildMuted) {
      // Si está muteado por servidor, usar emoji de guild mute
      muteIcon = GUILD_MUTE_EMOJI;
    } else if (isSelfMuted) {
      // Si solo está self muted (no guild muted), usar emoji de local mute
      muteIcon = LOCAL_MUTED_EMOJI;
    } else {
      // Si no está muteado, usar emoji normal
      muteIcon = UNMUTED_EMOJI;
    }
    
    // Deafen: 3 estados posibles
    const isGuildDeafened = member.voice.deaf; // Deafen de servidor
    const isSelfDeafened = member.voice.selfDeaf; // Deafen local (self)
    
    let deafIcon;
    if (isGuildDeafened) {
      // Si está deafened por servidor, usar emoji de guild deafen
      deafIcon = GUILD_DEAFEN_EMOJI;
    } else if (isSelfDeafened) {
      // Si solo está self deafened (no guild deafened), usar emoji de local deafen
      deafIcon = LOCAL_DEAFEN_EMOJI;
    } else {
      // Si no está deafened, usar emoji normal
      deafIcon = UNDEAFEN_EMOJI;
    }
    
    // Iconos de roles
    let roleIcons = "";
    if (isOwner(member)) {
      roleIcons += OWNER_EMOJI;
    } else if (isModerator(member)) {
      roleIcons += STAFF_EMOJI;
    }

    return `${muteIcon}${deafIcon} <@${member.id}> ${roleIcons}`;
  }).join("\n");

  // Primer usuario para el header (el usuario mencionado o el primero del canal)
  const firstMember = members[0];
  const headerText = `<@${firstMember.id}> está en`;

  const embed = new EmbedBuilder()
    .setDescription(`${headerText} <#${channel.id}>\n\n${memberList}`)
    .setColor(0x393a41);

  return embed;
}

// Helper para parsear markdown de emoji y convertir a formato de componente
// Discord.js necesita { id: string } para emojis custom en componentes
function parseEmojiMarkdown(markdown, fallback) {
  if (!markdown || typeof markdown !== 'string') return fallback;
  
  // Formato: <:name:id> o <a:name:id> para animados
  const match = markdown.match(/^<a?:(\w+):(\d+)>$/);
  if (match) {
    return { id: match[2], name: match[1] };
  }
  
  return fallback;
}

// Helper para crear componentes de moderación (menú + botones)
export function createVoiceModComponents(channel, members, moderator, targetMember = null, client = null) {
  // Emojis custom en formato markdown (para referencia)
  const muteEmojiMarkdown = "<:guild_mute:1455326680838050004>";
  const unmutedEmojiMarkdown = "<:microphone:1455326669803094066>";
  const refreshEmojiMarkdown = "<:refresh:1455329478321373468>";
  const moveOutEmojiMarkdown = "<:move_out:1455333144248058064>";
  const moveInEmojiMarkdown = "<:move_in:1455333134274134119>";
  
  // Convertir a formato de componente
  const muteEmoji = parseEmojiMarkdown(muteEmojiMarkdown, "🔇");
  const unmutedEmoji = parseEmojiMarkdown(unmutedEmojiMarkdown, "🔊");
  const refreshEmoji = parseEmojiMarkdown(refreshEmojiMarkdown, "🔄");
  const moveOutEmoji = parseEmojiMarkdown(moveOutEmojiMarkdown, "👥");
  const moveInEmoji = parseEmojiMarkdown(moveInEmojiMarkdown, "🔊");

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

  // Si hay un targetMember (comando voiceuser), agregar opción para moverlo
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

  // Agregar opciones por usuario (solo mutear, toggle)
  const nonMods = members.filter(m => 
    !m.permissions.has(PermissionFlagsBits.MuteMembers) &&
    !m.permissions.has(PermissionFlagsBits.MoveMembers) &&
    m.id !== moderator.guild.ownerId
  );

  nonMods.slice(0, 21).forEach(member => {
    const isMuted = member.voice.mute || member.voice.selfMute;
    menuOptions.push({
      label: `${isMuted ? "Desmutear" : "Mutear"} ${member.user.username}`,
      value: `mod_mute_${member.id}`,
      description: `${isMuted ? "Desmutear" : "Mutear"} a ${member.user.username}`,
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

  // Botones rápidos (solo emojis, sin texto) - todos grises
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
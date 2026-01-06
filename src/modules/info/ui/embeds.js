import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../../../utils/time.js";
import * as UserinfoService from "../services/userinfo.service.js";
import { MODULES, MODULE_NAMES, getAllModules, getCommandModule } from "../../moderation/services/modules.service.js";
import { t, getLocaleForGuild, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

export async function createUserinfoOverview(member, guild, locale = null) {
  if (!locale) {
    locale = await getLocaleForGuild(guild);
  }
  const trustScore = await UserinfoService.getUserTrustScore(guild.id, member.id);
  const highestRole = member.roles.highest;
  const highestRoleDisplay = highestRole && highestRole.id !== guild.id 
    ? `<@&${highestRole.id}>` 
    : t(locale, "info.embeds.userinfo.overview.none");

  // Use Discord timestamps for dates
  const createdTimestamp = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`;
  const joinedTimestamp = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`;

  // User mention
  const userMention = `<@${member.id}>`;

  const embed = new EmbedBuilder()
    .setColor(member.displayColor || 0x5865f2)
    .setAuthor({ 
      name: member.user.username, 
      iconURL: member.user.displayAvatarURL({ dynamic: true, size: 256 }) 
    })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_user_id"), 
        value: member.id, 
        inline: false 
      },
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_user"), 
        value: userMention, 
        inline: false 
      },
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_joined_discord"), 
        value: createdTimestamp, 
        inline: false 
      },
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_joined_server"), 
        value: joinedTimestamp, 
        inline: false 
      },
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_highest_role"), 
        value: highestRoleDisplay, 
        inline: true 
      },
      { 
        name: t(locale, "info.embeds.userinfo.overview.field_trust_score"), 
        value: `${trustScore}/100`, 
        inline: true 
      }
    )
    .setTimestamp();

  return embed;
}

export async function createUserinfoSanctions(member, guild) {
  const sanctions = await UserinfoService.getUserSanctions(guild.id, member.id);

  const targetName = member.user.tag || member.user.username || "Unknown";
  const targetDisplay = `${targetName} (${member.id})`;

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({
      name: targetDisplay,
      iconURL: member.user.displayAvatarURL?.() || member.user.avatarURL?.() || null
    });

  if (sanctions.length === 0) {
    embed.setDescription("No sanctions recorded");
    return embed;
  }

  const TYPE_NAMES = {
    WARN: "warn",
    MUTE: "mute",
    UNMUTE: "unmute",
    TIMEOUT: "timeout",
    UNTIMEOUT: "untimeout",
    KICK: "kick",
    BAN: "ban",
    TEMPBAN: "tempban",
    SOFTBAN: "softban",
    UNBAN: "unban"
  };

  // Contar por tipo
  const counts = {
    warned: 0,
    muted: 0,
    timeouted: 0,
    kicked: 0,
    banned: 0
  };

  sanctions.forEach(s => {
    const caseType = s.type?.toUpperCase();
    if (caseType === "WARN") counts.warned++;
    else if (caseType === "MUTE") counts.muted++;
    else if (caseType === "TIMEOUT") counts.timeouted++;
    else if (caseType === "KICK") counts.kicked++;
    else if (caseType === "BAN" || caseType === "TEMPBAN" || caseType === "SOFTBAN") counts.banned++;
  });

  // Limitar a 10 casos
  const fields = sanctions.slice(0, 10).map(s => {
    const actionName = s.type ? (TYPE_NAMES[s.type] || s.type.toLowerCase()) : "unknown";
    // Las acciones NO se traducen según las reglas

    return {
      name: t(locale, "info.embeds.userinfo.sanctions.field_case_format", { id: s.id, action: actionName }),
      value: s.reason || t(locale, "info.embeds.userinfo.sanctions.no_reason"),
      inline: false
    };
  });

  embed.addFields(fields);

  // Footer con conteos
  embed.setFooter({ text: t(locale, "info.embeds.userinfo.sanctions.footer_counts", { warned: counts.warned, muted: counts.muted, timeouted: counts.timeouted, kicked: counts.kicked, banned: counts.banned }) });

  return embed;
}

export async function createUserinfoVoice(member, guild) {
  const activities = await UserinfoService.getUserVoiceActivity(guild.id, member.id);

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setAuthor({ name: `${member.user.tag} - Voice Activity`, iconURL: member.user.displayAvatarURL() })
    .setTimestamp();

  if (activities.length === 0) {
    embed.setDescription("No voice activity recorded");
    return embed;
  }

  const fields = activities.map(a => {
    const actionNames = { JOIN: "Joined", LEAVE: "Left", MOVE: "Moved" };
    const channel = a.channel_id ? `<#${a.channel_id}>` : "Unknown";
    return {
      name: `${actionNames[a.action] || a.action} - ${channel}`,
      value: `<t:${Math.floor(a.at / 1000)}:R>`,
      inline: false
    };
  });

  embed.addFields(fields);

  return embed;
}

export async function createUserinfoMessages(member, guild, locale = null) {
  if (!locale) {
    locale = await getLocaleForGuild(guild);
  }
  
  const messages = await UserinfoService.getUserMessages(guild.id, member.id);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ name: `${member.user.tag} - ${t(locale, "info.embeds.userinfo.messages.title")}`, iconURL: member.user.displayAvatarURL() })
    .setTimestamp();

  if (messages.length === 0) {
    embed.setDescription(t(locale, "info.embeds.userinfo.messages.description_no_messages"));
    return embed;
  }

  const fields = messages.map(m => {
    const content = m.content ? (m.content.length > 200 ? m.content.substring(0, 200) + "..." : m.content) : t(locale, "info.embeds.userinfo.messages.field_no_content");
    return {
      name: `<#${m.channel_id}>`,
      value: `${content}\n<t:${Math.floor(m.at / 1000)}:R>`,
      inline: false
    };
  });

  embed.addFields(fields);

  return embed;
}

export async function createUserinfoPermissions(member, guild) {
  const { userPolicies, rolePolicies } = await UserinfoService.getUserPermissions(guild.id, member.id, member);

  const embed = new EmbedBuilder()
    .setColor(0xaa00ff)
    .setAuthor({ name: `${member.user.tag} - Permissions/Overrides`, iconURL: member.user.displayAvatarURL() })
    .setTimestamp();

  // Combinar todas las políticas
  const allPolicies = [...userPolicies, ...rolePolicies];

  if (allPolicies.length === 0) {
    embed.setDescription("No permission overrides configured");
    return embed;
  }

  // Separar políticas de módulos y comandos
  const allModuleNames = getAllModules();
  const modulePolicies = allPolicies.filter(p => allModuleNames.includes(p.command_key));
  const commandPolicies = allPolicies.filter(p => !allModuleNames.includes(p.command_key));

  // Módulos permitidos y denegados (solo explícitos)
  const allowedModules = modulePolicies.filter(p => p.effect === "ALLOW").map(p => MODULE_NAMES[p.command_key] || p.command_key);
  const deniedModules = modulePolicies.filter(p => p.effect === "DENY").map(p => MODULE_NAMES[p.command_key] || p.command_key);

  // Comandos permitidos y denegados
  const allowedCommands = commandPolicies.filter(p => p.effect === "ALLOW").map(p => p.command_key);
  const deniedCommands = commandPolicies.filter(p => p.effect === "DENY").map(p => p.command_key);

  // Agregar campos para módulos
  embed.addFields({
    name: "Allowed Modules",
    value: allowedModules.length > 0 ? allowedModules.join(", ") : "None",
    inline: false
  });

  embed.addFields({
    name: "Denied Modules",
    value: deniedModules.length > 0 ? deniedModules.join(", ") : "None",
    inline: false
  });

  // Agregar campos para comandos
  embed.addFields({
    name: "Allowed Commands",
    value: allowedCommands.length > 0 ? allowedCommands.join(", ") : "None",
    inline: false
  });

  embed.addFields({
    name: "Denied Commands",
    value: deniedCommands.length > 0 ? deniedCommands.join(", ") : "None",
    inline: false
  });

  return embed;
}

export async function createUserinfoStatistics(member, stats, guild, locale = null) {
  if (!locale && guild) {
    locale = await getLocaleForGuild(guild);
  } else if (!locale) {
    locale = DEFAULT_LOCALE;
  }
  
  const voiceTime = stats?.total_voice_seconds ?? 0;
  const messageCount = stats?.message_count ?? 0;
  
  const embed = new EmbedBuilder()
    .setColor(member.displayColor || 0x5865f2)
    .setAuthor({ 
      name: `${member.user.tag} - ${t(locale, "info.embeds.userinfo.statistics.title")}`, 
      iconURL: member.user.displayAvatarURL({ dynamic: true, size: 256 }) 
    })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      {
        name: t(locale, "info.embeds.userinfo.statistics.field_voice_time"),
        value: formatDuration(voiceTime),
        inline: false
      },
      {
        name: t(locale, "info.embeds.userinfo.statistics.field_messages"),
        value: messageCount.toLocaleString(locale === "es-ES" ? "es-ES" : "en-US"),
        inline: false
      }
    )
    .setTimestamp();

  return embed;
}

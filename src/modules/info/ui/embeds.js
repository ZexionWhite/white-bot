import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../../../utils/time.js";
import * as UserinfoService from "../services/userinfo.service.js";
import { MODULES, MODULE_NAMES, getAllModules, getCommandModule } from "../../moderation/services/modules.service.js";

export function createUserinfoOverview(member, guild) {
  const trustScore = UserinfoService.getUserTrustScore(guild.id, member.id);
  const highestRole = member.roles.highest;
  const highestRoleDisplay = highestRole && highestRole.id !== guild.id 
    ? `<@&${highestRole.id}>` 
    : "None";

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
        name: "User ID", 
        value: member.id, 
        inline: false 
      },
      { 
        name: "User", 
        value: userMention, 
        inline: false 
      },
      { 
        name: "Joined Discord", 
        value: createdTimestamp, 
        inline: false 
      },
      { 
        name: "Joined Server", 
        value: joinedTimestamp, 
        inline: false 
      },
      { 
        name: "Highest Role", 
        value: highestRoleDisplay, 
        inline: true 
      },
      { 
        name: "Trust Score", 
        value: `${trustScore}/100`, 
        inline: true 
      }
    )
    .setTimestamp();

  return embed;
}

export function createUserinfoSanctions(member, guild) {
  const sanctions = UserinfoService.getUserSanctions(guild.id, member.id);

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setAuthor({ name: `${member.user.tag} - Sanctions`, iconURL: member.user.displayAvatarURL() });

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

  const fields = sanctions.slice(0, 10).map(s => {
    const actionName = TYPE_NAMES[s.type] || s.type.toLowerCase();
    const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
    
    return {
      name: `${actionCapitalized} • Case #${s.id}`,
      value: `${s.reason || "No reason"}\n<t:${Math.floor(s.created_at / 1000)}:R>`,
      inline: false
    };
  });

  embed.addFields(fields);

  return embed;
}

export function createUserinfoVoice(member, guild) {
  const activities = UserinfoService.getUserVoiceActivity(guild.id, member.id);

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

export function createUserinfoMessages(member, guild) {
  const messages = UserinfoService.getUserMessages(guild.id, member.id);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ name: `${member.user.tag} - Recent Messages`, iconURL: member.user.displayAvatarURL() })
    .setTimestamp();

  if (messages.length === 0) {
    embed.setDescription("No messages recorded");
    return embed;
  }

  const fields = messages.map(m => {
    const content = m.content ? (m.content.length > 200 ? m.content.substring(0, 200) + "..." : m.content) : "*No content*";
    return {
      name: `<#${m.channel_id}>`,
      value: `${content}\n<t:${Math.floor(m.at / 1000)}:R>`,
      inline: false
    };
  });

  embed.addFields(fields);

  return embed;
}

export function createUserinfoPermissions(member, guild) {
  const { userPolicies, rolePolicies } = UserinfoService.getUserPermissions(guild.id, member.id, member);

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

export function createUserinfoStatistics(member, stats) {
  const voiceTime = stats?.total_voice_seconds ?? 0;
  const messageCount = stats?.message_count ?? 0;
  
  const embed = new EmbedBuilder()
    .setColor(member.displayColor || 0x5865f2)
    .setAuthor({ 
      name: `${member.user.tag} - Statistics`, 
      iconURL: member.user.displayAvatarURL({ dynamic: true, size: 256 }) 
    })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      {
        name: "Voice Time",
        value: formatDuration(voiceTime),
        inline: false
      },
      {
        name: "Messages",
        value: messageCount.toLocaleString("en-US"),
        inline: false
      }
    )
    .setTimestamp();

  return embed;
}

import { EmbedBuilder } from "discord.js";
import { formatDurationMs } from "../../../utils/duration.js";

export const TYPE_COLORS = {
  WARN: 0xffaa00,
  MUTE: 0xff8800,
  UNMUTE: 0x00ff88,
  TIMEOUT: 0xff4400,
  UNTIMEOUT: 0x00ff44,
  KICK: 0xff0000,
  BAN: 0xcc0000,
  TEMPBAN: 0xaa0000,
  SOFTBAN: 0xff6600,
  UNBAN: 0x00cc00
};

export const TYPE_NAMES = {
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

export function createModlogEmbed(case_, target, moderator, dmSent = null) {
  const actionName = TYPE_NAMES[case_.type] || case_.type.toLowerCase();
  const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
  
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${case_.target_id})`;
  
  // Build description with Duration first (if exists), then Reason last
  let description = `**Member:** ${targetDisplay}\n**Action:** ${actionCapitalized}`;
  
  if (case_.expires_at) {
    const duration = case_.expires_at - case_.created_at;
    const durationFormatted = formatDurationMs(duration);
    description += `\n**Duration:** ${durationFormatted}`;
  }
  
  description += `\n**Reason:** ${case_.reason || "No reason"}`;
  
  const embed = new EmbedBuilder()
    .setColor(TYPE_COLORS[case_.type] || 0xffaa00)
    .setAuthor({ 
      name: moderator.tag || moderator.username || "Unknown", 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: `Case #${case_.id}` });
  
  // Solo setear timestamp si created_at es válido
  if (case_.created_at && typeof case_.created_at === 'number' && case_.created_at > 0) {
    embed.setTimestamp(case_.created_at);
  }

  return embed;
}

export function createSuccessEmbed(action, target, caseId = null) {
  // Lista de acciones de sanción válidas (cortas y sin caracteres especiales)
  const sanctionActions = ["warn", "mute", "unmute", "timeout", "untimeout", "kick", "ban", "tempban", "softban", "unban", "advertencia"];
  const actionLower = typeof action === "string" ? action.toLowerCase() : "";
  
  // Si es una acción de sanción y tiene target con id, usar formato minimalista
  const isSanction = sanctionActions.includes(actionLower) && target?.id && caseId;
  
  if (isSanction) {
    // Para sanciones, usar formato minimalista
    const actionName = typeof action === "string" ? action : (TYPE_NAMES[action] || action);
    // Normalizar "Advertencia" a "Warn"
    const normalizedAction = actionLower === "advertencia" ? "warn" : actionName;
    const actionCapitalized = normalizedAction.charAt(0).toUpperCase() + normalizedAction.slice(1);
    
    const targetName = target.tag || target.username || "Unknown";
    const targetDisplay = `${targetName} (${target.id})`;
    
    const description = `**Member:** ${targetDisplay}\n**Action:** ${actionCapitalized}`;
    
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setDescription(description)
      .setFooter({ text: `Case #${caseId}` });

    return embed;
  }
  
  // Para configuraciones y otros mensajes, usar formato simple
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setDescription(`✅ ${action}`);
}

export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(`❌ ${message}`);
}

export function createCaseEmbed(case_, target, moderator) {
  const actionName = TYPE_NAMES[case_.type] || case_.type.toLowerCase();
  const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
  
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${case_.target_id})`;
  
  const moderatorName = moderator.tag || moderator.username || "Unknown";
  
  // Build description with Duration first (if exists), then Reason last
  let description = `**Member:** ${targetDisplay}\n**Action:** ${actionCapitalized}`;
  
  if (case_.expires_at) {
    const duration = case_.expires_at - case_.created_at;
    const durationFormatted = formatDurationMs(duration);
    description += `\n**Duration:** ${durationFormatted}`;
  }
  
  description += `\n**Reason:** ${case_.reason || "No reason"}`;
  
  if (case_.deleted_at) {
    const deletedByMention = case_.deleted_by ? `<@${case_.deleted_by}>` : "Usuario desconocido";
    description += `\n**Deleted:** <t:${Math.floor(case_.deleted_at / 1000)}:R>\n**Deleted by:** ${deletedByMention}\n**Deletion reason:** ${case_.deleted_reason || "No reason"}`;
  }
  
  const embed = new EmbedBuilder()
    .setColor(case_.deleted_at ? 0x808080 : (TYPE_COLORS[case_.type] || 0xffaa00))
    .setAuthor({ 
      name: moderatorName, 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: `Case #${case_.id}` });
  
  // Solo setear timestamp si created_at es válido
  if (case_.created_at && typeof case_.created_at === 'number' && case_.created_at > 0) {
    embed.setTimestamp(case_.created_at);
  }

  return embed;
}

export function createHistoryEmbed(cases, target, page, totalPages, type = null) {
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${target.id})`;
  
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ 
      name: targetDisplay,
      iconURL: target.displayAvatarURL?.() || target.avatarURL?.() || null 
    })
    .setFooter({ text: `Page ${page}/${totalPages}` });

  if (cases.length === 0) {
    embed.setDescription("No sanctions recorded");
    return embed;
  }

  const fields = cases.slice(0, 10).map(c => {
    const actionName = TYPE_NAMES[c.type] || c.type.toLowerCase();
    const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
    
    return {
      name: `${actionCapitalized} • Case #${c.id}`,
      value: `${c.reason || "No reason"}\n<t:${Math.floor(c.created_at / 1000)}:R>`,
      inline: false
    };
  });

  embed.addFields(fields);

  return embed;
}


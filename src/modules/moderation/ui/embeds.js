import { EmbedBuilder } from "discord.js";
import { formatDurationMs } from "../../../utils/duration.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

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

export function createModlogEmbed(case_, target, moderator, dmSent = null, locale = DEFAULT_LOCALE) {
  const actionName = case_.type ? (TYPE_NAMES[case_.type] || case_.type.toLowerCase()) : "unknown";
  // Las acciones NO se traducen según las reglas
  const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
  
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${case_.target_id})`;
  
  // Build description with Duration first (if exists), then Reason last
  let description = t(locale, "moderation.embeds.warn.description_member", { member: targetDisplay }) + "\n" +
                    t(locale, "moderation.embeds.warn.description_action", { action: actionCapitalized });
  
  if (case_.expires_at) {
    const duration = case_.expires_at - case_.created_at;
    const durationFormatted = formatDurationMs(duration);
    description += "\n" + t(locale, "moderation.embeds.mute.description_duration", { duration: durationFormatted });
  }
  
  description += "\n" + t(locale, "moderation.embeds.warn.description_reason", { reason: case_.reason || t(locale, "common.errors.no_reason") });
  
  const embed = new EmbedBuilder()
    .setColor(TYPE_COLORS[case_.type] || 0xffaa00)
    .setAuthor({ 
      name: moderator.tag || moderator.username || "Unknown", 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: t(locale, "moderation.embeds.warn.footer_case", { caseId: case_.id }) });
  
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

export function createErrorEmbed(message, locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(t(locale, "moderation.embeds.error.title", { message }));
}

export function createCaseEmbed(case_, target, moderator, locale = DEFAULT_LOCALE) {
  const actionName = case_.type ? (TYPE_NAMES[case_.type] || case_.type.toLowerCase()) : "unknown";
  // Las acciones NO se traducen según las reglas
  const actionCapitalized = actionName.charAt(0).toUpperCase() + actionName.slice(1);
  
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${case_.target_id})`;
  
  const moderatorName = moderator.tag || moderator.username || "Unknown";
  
  // Build description with Duration first (if exists), then Reason last
  let description = t(locale, "moderation.embeds.case.description_member", { member: targetDisplay }) + "\n" +
                    t(locale, "moderation.embeds.case.description_action", { action: actionCapitalized });
  
  if (case_.expires_at) {
    const duration = case_.expires_at - case_.created_at;
    const durationFormatted = formatDurationMs(duration);
    description += "\n" + t(locale, "moderation.embeds.case.description_duration", { duration: durationFormatted });
  }
  
  description += "\n" + t(locale, "moderation.embeds.case.description_reason", { reason: case_.reason || t(locale, "moderation.embeds.case.no_reason") });
  
  if (case_.deleted_at) {
    const deletedByMention = case_.deleted_by ? `<@${case_.deleted_by}>` : t(locale, "common.errors.user_not_found");
    description += "\n" + t(locale, "moderation.embeds.case.description_deleted", { timestamp: `<t:${Math.floor(case_.deleted_at / 1000)}:R>` }) +
                "\n" + t(locale, "moderation.embeds.case.description_deleted_by", { deleter: deletedByMention }) +
                "\n" + t(locale, "moderation.embeds.case.description_deletion_reason", { reason: case_.deleted_reason || t(locale, "moderation.embeds.case.no_reason") });
  }
  
  const embed = new EmbedBuilder()
    .setColor(case_.deleted_at ? 0x808080 : (TYPE_COLORS[case_.type] || 0xffaa00))
    .setAuthor({ 
      name: moderatorName, 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: t(locale, "moderation.embeds.case.footer_case", { caseId: case_.id }) });
  
  // Solo setear timestamp si created_at es válido
  if (case_.created_at && typeof case_.created_at === 'number' && case_.created_at > 0) {
    embed.setTimestamp(case_.created_at);
  }

  return embed;
}

export function createHistoryEmbed(cases, target, page, totalPages, type = null, counts = null, locale = DEFAULT_LOCALE) {
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${target.id})`;
  
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ 
      name: targetDisplay,
      iconURL: target.displayAvatarURL?.() || target.avatarURL?.() || null 
    });

  if (cases.length === 0) {
    embed.setDescription(t(locale, "moderation.embeds.history.description_no_sanctions"));
    if (counts) {
      const footerParts = [
        t(locale, "moderation.embeds.history.footer_warned", { warned: counts.warned }),
        t(locale, "moderation.embeds.history.footer_muted", { muted: counts.muted }),
        t(locale, "moderation.embeds.history.footer_timeouted", { timeouted: counts.timeouted }),
        t(locale, "moderation.embeds.history.footer_kicked", { kicked: counts.kicked }),
        t(locale, "moderation.embeds.history.footer_banned", { banned: counts.banned })
      ];
      const footerText = footerParts.join(t(locale, "moderation.embeds.history.footer_counts_separator"));
      embed.setFooter({ text: footerText });
    } else {
      embed.setFooter({ text: t(locale, "moderation.embeds.history.footer_page", { page, totalPages }) });
    }
    return embed;
  }

  // Limitar a 10 casos por página
  const fields = cases.slice(0, 10).map(c => {
    const actionName = c.type ? (TYPE_NAMES[c.type] || c.type.toLowerCase()) : "unknown";
    // Las acciones NO se traducen según las reglas
    
    return {
      name: t(locale, "moderation.embeds.history.field_case_format", { caseId: c.id, action: actionName }),
      value: c.reason || t(locale, "moderation.embeds.history.no_reason"),
      inline: false
    };
  });

  embed.addFields(fields);

  // Footer con conteos si están disponibles, sino solo página
  if (counts) {
    const footerParts = [
      t(locale, "moderation.embeds.history.footer_warned", { warned: counts.warned }),
      t(locale, "moderation.embeds.history.footer_muted", { muted: counts.muted }),
      t(locale, "moderation.embeds.history.footer_timeouted", { timeouted: counts.timeouted }),
      t(locale, "moderation.embeds.history.footer_kicked", { kicked: counts.kicked }),
      t(locale, "moderation.embeds.history.footer_banned", { banned: counts.banned })
    ];
    const footerText = footerParts.join(t(locale, "moderation.embeds.history.footer_counts_separator"));
    embed.setFooter({ text: footerText });
  } else {
    embed.setFooter({ text: t(locale, "moderation.embeds.history.footer_page", { page, totalPages }) });
  }

  return embed;
}


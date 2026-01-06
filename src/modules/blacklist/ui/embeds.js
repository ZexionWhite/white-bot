import { EmbedBuilder } from "discord.js";
import { t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";

const SEVERITY_COLORS = {
  LOW: 0x00ff00,
  MEDIUM: 0xffaa00,
  HIGH: 0xff4400,
  CRITICAL: 0xcc0000
};

export function createBlacklistEmbed(entry, target, moderator, locale = DEFAULT_LOCALE) {
  const targetName = target.tag || target.username || t(locale, "common.labels.unknown");
  const targetDisplay = `${targetName} (${entry.user_id})`;
  
  const severityName = entry.severity || "MEDIUM";
  // Severity y "Blacklist" NO se traducen según las reglas
  
  let description = t(locale, "blacklist.embeds.entry.description_member", { member: targetDisplay }) + "\n" +
                    t(locale, "blacklist.embeds.entry.description_action", { severity: severityName });
  description += "\n" + t(locale, "blacklist.embeds.entry.description_reason", { reason: entry.reason || t(locale, "blacklist.embeds.entry.no_reason") });

  const embed = new EmbedBuilder()
    .setColor(SEVERITY_COLORS[entry.severity] || 0x808080)
    .setAuthor({ 
      name: moderator.tag || moderator.username || t(locale, "common.labels.unknown"), 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: t(locale, "blacklist.embeds.entry.footer_entry", { id: entry.id }) });
  
  // Solo setear timestamp si created_at es válido
  if (entry.created_at && typeof entry.created_at === 'number' && entry.created_at > 0) {
    embed.setTimestamp(entry.created_at);
  }

  if (entry.updated_at) {
    embed.addFields(
      { name: t(locale, "blacklist.embeds.entry.field_updated"), value: `<t:${Math.floor(entry.updated_at / 1000)}:R>`, inline: true },
      { name: t(locale, "blacklist.embeds.entry.field_updated_by"), value: `<@${entry.updated_by}>`, inline: true }
    );
  }

  if (entry.deleted_at) {
    embed.addFields(
      { name: t(locale, "blacklist.embeds.entry.field_deleted"), value: `<t:${Math.floor(entry.deleted_at / 1000)}:R>`, inline: true },
      { name: t(locale, "blacklist.embeds.entry.field_deleted_by"), value: `<@${entry.deleted_by}>`, inline: true },
      { name: t(locale, "blacklist.embeds.entry.field_deletion_reason"), value: entry.deleted_reason || t(locale, "blacklist.embeds.entry.no_reason"), inline: false }
    );
    embed.setColor(0x808080);
  }

  return embed;
}

export function createBlacklistHistoryEmbed(entries, target, page, totalPages, counts = null) {
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${target.id})`;
  
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ 
      name: targetDisplay,
      iconURL: target.displayAvatarURL?.() || target.avatarURL?.() || null 
    });

  if (entries.length === 0) {
    embed.setDescription("No blacklist entries recorded");
    if (counts) {
      const footerText = `Low: ${counts.low} | Medium: ${counts.medium} | High: ${counts.high} | Critical: ${counts.critical}`;
      embed.setFooter({ text: footerText });
    } else {
      embed.setFooter({ text: `Page ${page}/${totalPages}` });
    }
    return embed;
  }

  // Limitar a 10 entradas por página
  const fields = entries.slice(0, 10).map(e => {
    const severityName = (e.severity || "MEDIUM").toLowerCase();
    
    return {
      name: `Entry #${e.id} - ${severityName}`,
      value: e.reason || "No reason",
      inline: false
    };
  });

  embed.addFields(fields);

  // Footer con conteos si están disponibles, sino solo página
  if (counts) {
    const footerText = `Low: ${counts.low} | Medium: ${counts.medium} | High: ${counts.high} | Critical: ${counts.critical}`;
    embed.setFooter({ text: footerText });
  } else {
    embed.setFooter({ text: `Page ${page}/${totalPages}` });
  }

  return embed;
}

export function createSuccessEmbed(message, target = null, entryId = null, locale = DEFAULT_LOCALE) {
  // Si es una entrada de blacklist exitosa, usar formato similar a createSanctionMessage
  if (target?.id && entryId) {
    const targetName = target.tag || target.username || t(locale, "common.labels.unknown");
    const targetDisplay = `${targetName} (${target.id})`;
    const description = t(locale, "blacklist.embeds.success.field_member", { member: targetDisplay }) + "\n" +
                        t(locale, "blacklist.embeds.success.field_action", { action: t(locale, "blacklist.embeds.success.created") });
    
    return new EmbedBuilder()
      .setColor(0x00ff00)
      .setDescription(description)
      .setFooter({ text: t(locale, "blacklist.embeds.entry.footer_entry", { id: entryId }) });
  }
  
  // Formato simple para otros mensajes
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setDescription(`✅ ${message}`);
}

export function createErrorEmbed(message, locale = DEFAULT_LOCALE) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(`❌ ${message}`);
}


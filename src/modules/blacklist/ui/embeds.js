import { EmbedBuilder } from "discord.js";

const SEVERITY_COLORS = {
  LOW: 0x00ff00,
  MEDIUM: 0xffaa00,
  HIGH: 0xff4400,
  CRITICAL: 0xcc0000
};

export function createBlacklistEmbed(entry, target, moderator) {
  const targetName = target.tag || target.username || "Unknown";
  const targetDisplay = `${targetName} (${entry.user_id})`;
  
  const severityName = entry.severity || "MEDIUM";
  const actionCapitalized = `Blacklist - ${severityName}`;
  
  // Build description similar to createModlogEmbed
  let description = `**Member:** ${targetDisplay}\n**Action:** ${actionCapitalized}`;
  description += `\n**Reason:** ${entry.reason || "No reason"}`;

  const embed = new EmbedBuilder()
    .setColor(SEVERITY_COLORS[entry.severity] || 0x808080)
    .setAuthor({ 
      name: moderator.tag || moderator.username || "Unknown", 
      iconURL: moderator.displayAvatarURL?.() || moderator.avatarURL?.() || null 
    })
    .setDescription(description)
    .setFooter({ text: `Entry #${entry.id}` });
  
  // Solo setear timestamp si created_at es válido
  if (entry.created_at && typeof entry.created_at === 'number' && entry.created_at > 0) {
    embed.setTimestamp(entry.created_at);
  }

  if (entry.updated_at) {
    embed.addFields(
      { name: "Actualizado", value: `<t:${Math.floor(entry.updated_at / 1000)}:R>`, inline: true },
      { name: "Actualizado por", value: `<@${entry.updated_by}>`, inline: true }
    );
  }

  if (entry.deleted_at) {
    embed.addFields(
      { name: "Eliminado", value: `<t:${Math.floor(entry.deleted_at / 1000)}:R>`, inline: true },
      { name: "Eliminado por", value: `<@${entry.deleted_by}>`, inline: true },
      { name: "Razón de eliminación", value: entry.deleted_reason || "Sin razón", inline: false }
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

export function createSuccessEmbed(message, target = null, entryId = null) {
  // Si es una entrada de blacklist exitosa, usar formato similar a createSanctionMessage
  if (target?.id && entryId) {
    const targetName = target.tag || target.username || "Unknown";
    const targetDisplay = `${targetName} (${target.id})`;
    const description = `**Member:** ${targetDisplay}\n**Action:** Blacklist entry created`;
    
    return new EmbedBuilder()
      .setColor(0x00ff00)
      .setDescription(description)
      .setFooter({ text: `Entry #${entryId}` });
  }
  
  // Formato simple para otros mensajes
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setDescription(`✅ ${message}`);
}

export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(`❌ ${message}`);
}


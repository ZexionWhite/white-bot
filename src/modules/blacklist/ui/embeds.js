import { EmbedBuilder } from "discord.js";

const SEVERITY_COLORS = {
  LOW: 0x00ff00,
  MEDIUM: 0xffaa00,
  HIGH: 0xff4400,
  CRITICAL: 0xcc0000
};

export function createBlacklistEmbed(entry, target, moderator) {
  const embed = new EmbedBuilder()
    .setColor(SEVERITY_COLORS[entry.severity] || 0x808080)
    .setTitle(`Blacklist Entry #${entry.id}`)
    .addFields(
      { name: "Usuario", value: `<@${entry.user_id}>`, inline: true },
      { name: "Moderador", value: `<@${entry.moderator_id}>`, inline: true },
      { name: "Severidad", value: entry.severity || "MEDIUM", inline: true },
      { name: "Razón", value: entry.reason || "Sin razón especificada", inline: false }
    )
    .setTimestamp(entry.created_at);

  if (entry.evidence) {
    embed.addFields({ name: "Evidencia", value: entry.evidence, inline: false });
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

export function createBlacklistHistoryEmbed(entries, target) {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("Historial de Blacklist")
    .setDescription(`Usuario: <@${target.id}>`)
    .setTimestamp();

  if (entries.length === 0) {
    embed.setDescription(`No hay entradas de blacklist para <@${target.id}>`);
    return embed;
  }

  const fields = entries.slice(0, 10).map(e => ({
    name: `Entry #${e.id} - ${e.severity || "MEDIUM"}`,
    value: `**Razón:** ${e.reason || "Sin razón"}\n**Fecha:** <t:${Math.floor(e.created_at / 1000)}:R>`,
    inline: false
  }));

  embed.addFields(fields);

  return embed;
}

export function createSuccessEmbed(message) {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setDescription(`✅ ${message}`);
}

export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setDescription(`❌ ${message}`);
}


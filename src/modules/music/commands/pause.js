/**
 * Comando /pause
 * Pausa la reproducción
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { canControl } from "../services/permissions.service.js";
import { pause, isPlaying, isPaused } from "../services/player.service.js";
import { createErrorEmbed } from "../ui/embeds.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const locale = await getLocaleForGuildId(itx.guild.id);

  // Verificar permisos
  if (!canControl(itx.member)) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.no_dj_permission"))],
      ephemeral: true
    });
  }

  const guildId = itx.guild.id;

  if (!isPlaying(guildId) || isPaused(guildId)) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.not_playing"))],
      ephemeral: true
    });
  }

  pause(guildId);

  return itx.reply({
    content: t(locale, "music.success.paused")
  });
}

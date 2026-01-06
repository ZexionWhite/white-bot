/**
 * Comando /skip
 * Salta la canción actual o múltiples canciones
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { checkLavalinkAvailability } from "../services/lavalink-guard.js";
import { canControl } from "../services/permissions.service.js";
import { getQueue } from "../services/queue.service.js";
import { getPlayer, stop, playTrack, isPlaying } from "../services/player.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { handleTrackEnd } from "../events/trackEnd.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const locale = await getLocaleForGuildId(itx.guild.id);

  // Verificar que Lavalink esté disponible
  const lavalinkCheck = checkLavalinkAvailability(locale);
  if (!lavalinkCheck.available) {
    return itx.reply({
      embeds: [lavalinkCheck.errorEmbed],
      ephemeral: true
    });
  }

  // Verificar permisos
  if (!canControl(itx.member)) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.no_dj_permission"))],
      ephemeral: true
    });
  }

  const amount = itx.options.getInteger("amount") || 1;

  if (amount < 1) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.skip_amount_invalid"))],
      ephemeral: true
    });
  }

  const guildId = itx.guild.id;
  const queue = getQueue(guildId);

  if (!isPlaying(guildId) && queue.isEmpty()) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.not_playing"))],
      ephemeral: true
    });
  }

  // Si amount es 1, solo saltar el track actual
  if (amount === 1) {
    const currentTrack = getPlayer(guildId)?.track;
    await stop(guildId);
    
    if (currentTrack) {
      await handleTrackEnd(guildId, currentTrack, "STOPPED");
    }

    return itx.reply({
      content: t(locale, "music.success.skipped", { count: 1, track: "track" })
    });
  }

  // Si amount > 1, remover tracks de la cola y saltar el actual
  let skipped = 1; // El track actual
  const toRemove = Math.min(amount - 1, queue.size());
  
  for (let i = 0; i < toRemove; i++) {
    queue.dequeue();
    skipped++;
  }

  // Saltar el track actual
  const currentTrack = getPlayer(guildId)?.track;
  await stop(guildId);
  
  if (currentTrack) {
    await handleTrackEnd(guildId, currentTrack, "STOPPED");
  }

  return itx.reply({
    content: t(locale, "music.success.skipped", { count: skipped, track: skipped === 1 ? "track" : "tracks" })
  });
}

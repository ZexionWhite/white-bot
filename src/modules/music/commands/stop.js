/**
 * Comando /stop
 * Detiene la reproducción y limpia la cola
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { checkLavalinkAvailability } from "../services/lavalink-guard.js";
import { canControl } from "../services/permissions.service.js";
import { getQueue } from "../services/queue.service.js";
import { stop, disconnect, cleanup } from "../services/player.service.js";
import { createErrorEmbed } from "../ui/embeds.js";

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

  const guildId = itx.guild.id;
  const queue = getQueue(guildId);

  queue.clear();
  await stop(guildId);
  await disconnect(guildId);
  cleanup(guildId);

  return itx.reply({
    content: t(locale, "music.success.stopped")
  });
}

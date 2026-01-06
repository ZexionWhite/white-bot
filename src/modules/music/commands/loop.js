/**
 * Comando /loop
 * Configura el modo de loop
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { checkLavalinkAvailability } from "../services/lavalink-guard.js";
import { canControl } from "../services/permissions.service.js";
import { setLoopMode } from "../events/trackEnd.js";
import { createErrorEmbed } from "../ui/embeds.js";

const VALID_MODES = ["off", "track", "queue"];

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

  const mode = itx.options.getString("mode", true).toLowerCase();

  if (!VALID_MODES.includes(mode)) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.invalid_loop_mode"))],
      ephemeral: true
    });
  }

  const guildId = itx.guild.id;
  setLoopMode(guildId, mode);

  const modeText = mode === "off" 
    ? t(locale, "music.embeds.nowplaying.loop_off")
    : mode === "track"
    ? t(locale, "music.embeds.nowplaying.loop_track")
    : t(locale, "music.embeds.nowplaying.loop_queue");

  return itx.reply({
    content: t(locale, "music.success.loop_set", { mode: modeText })
  });
}

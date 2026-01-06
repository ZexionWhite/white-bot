/**
 * Comando /autoplay
 * Activa o desactiva el autoplay
 */
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { canControl } from "../services/permissions.service.js";
import { setAutoplay } from "../events/trackEnd.js";
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

  const state = itx.options.getString("state", true).toLowerCase();

  if (state !== "on" && state !== "off") {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.invalid_autoplay"))],
      ephemeral: true
    });
  }

  const guildId = itx.guild.id;
  const enabled = state === "on";
  setAutoplay(guildId, enabled);

  return itx.reply({
    content: enabled 
      ? t(locale, "music.success.autoplay_enabled")
      : t(locale, "music.success.autoplay_disabled")
  });
}

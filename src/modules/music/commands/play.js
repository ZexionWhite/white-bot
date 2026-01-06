/**
 * Comando /play
 * Reproduce música desde una URL o búsqueda
 */
import { ChannelType } from "discord.js";
import { getLocaleForGuildId, t } from "../../../core/i18n/index.js";
import { checkLavalinkAvailability } from "../services/lavalink-guard.js";
import { resolveQuery, getFirstTrack } from "../services/search.service.js";
import { getQueue } from "../services/queue.service.js";
import { getPlayer, connectToVoice, playTrack, isPlaying } from "../services/player.service.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { log } from "../../../core/logger/index.js";

export async function handle(itx) {
  if (!itx.inGuild()) {
    return itx.reply({ content: t(await getLocaleForGuildId(itx.guild.id), "common.errors.guild_only"), ephemeral: true });
  }

  const query = itx.options.getString("query", true);
  const locale = await getLocaleForGuildId(itx.guild.id);

  // Verificar que Lavalink esté disponible
  const lavalinkCheck = checkLavalinkAvailability(locale);
  if (!lavalinkCheck.available) {
    return itx.reply({
      embeds: [lavalinkCheck.errorEmbed],
      ephemeral: true
    });
  }

  // Verificar que el usuario está en un canal de voz
  const member = itx.member;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.not_in_voice"))],
      ephemeral: true
    });
  }

  // Verificar permisos del bot
  const botMember = await itx.guild.members.fetch(itx.client.user.id);
  const permissions = voiceChannel.permissionsFor(botMember);

  if (!permissions.has("Connect")) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.bot_no_connect"))],
      ephemeral: true
    });
  }

  if (!permissions.has("Speak")) {
    return itx.reply({
      embeds: [createErrorEmbed(t(locale, "music.errors.bot_no_speak"))],
      ephemeral: true
    });
  }

  await itx.deferReply();

  try {
    // Resolver query
    const result = await resolveQuery(query, itx.user.id);

    if (!result || !result.tracks || result.tracks.length === 0) {
      return itx.editReply({
        embeds: [createErrorEmbed(t(locale, "music.errors.no_tracks_found", { query }))]
      });
    }

    const firstTrack = getFirstTrack(result);
    if (!firstTrack) {
      return itx.editReply({
        embeds: [createErrorEmbed(t(locale, "music.errors.no_tracks_found", { query }))]
      });
    }

    const guildId = itx.guild.id;
    const queue = getQueue(guildId);
    let player = getPlayer(guildId);

    // Conectar a voz si no está conectado
    if (!player || !player.voiceChannelId) {
      const connected = await connectToVoice(guildId, voiceChannel.id, itx.channel.id);
      if (!connected) {
        return itx.editReply({
          embeds: [createErrorEmbed(t(locale, "music.errors.bot_no_connect"))]
        });
      }
      // Obtener el player nuevamente después de conectar
      player = getPlayer(guildId);
    }

    // Añadir a la cola
    queue.enqueue(firstTrack, itx.user.id);

    // Si no está reproduciendo, comenzar
    if (!isPlaying(guildId)) {
      const item = queue.dequeue();
      if (item) {
        await playTrack(guildId, item.track);
      }
    }

    // Responder
    const title = firstTrack.info.title || "Unknown Title";
    const count = result.tracks.length;

    if (count === 1) {
      return itx.editReply({
        content: t(locale, "music.success.play_single", { title })
      });
    } else {
      return itx.editReply({
        content: t(locale, "music.success.play_multiple", { title, count })
      });
    }

  } catch (error) {
    log.error("Play", `Error en comando play:`, error);
    return itx.editReply({
      embeds: [createErrorEmbed(t(locale, "music.errors.play_failed", { error: error.message }))]
    });
  }
}

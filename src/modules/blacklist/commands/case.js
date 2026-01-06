import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createBlacklistEmbed, createErrorEmbed } from "../ui/embeds.js";
import { log } from "../../../core/logger/index.js";
import { getLocaleForGuild, t, DEFAULT_LOCALE } from "../../../core/i18n/index.js";
import { MessageFlags } from "discord.js";

export async function handle(itx) {
  try {
    const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
    
    if (!itx.inGuild()) {
      return itx.reply({ content: `❌ ${t(locale, "common.errors.guild_only")}`, flags: MessageFlags.Ephemeral });
    }

    const caseId = itx.options.getInteger("id", true);

    if (!await PermService.canExecuteCommand(itx.member, "blacklist.case")) {
      return itx.reply({ embeds: [createErrorEmbed(t(locale, "common.errors.permission_denied"), locale)], flags: MessageFlags.Ephemeral });
    }

    const entry = await BlacklistService.getEntry(itx.guild.id, caseId);
    if (!entry) {
      return itx.reply({ embeds: [createErrorEmbed(t(locale, "blacklist.errors.not_found", { caseId }), locale)], flags: MessageFlags.Ephemeral });
    }

    let target, moderator;
    try {
      target = await itx.client.users.fetch(entry.user_id);
    } catch (err) {
      log.warn("blacklist case", `No se pudo obtener usuario target ${entry.user_id}:`, err.message);
      target = { id: entry.user_id, tag: "Usuario desconocido", username: "Usuario desconocido" };
    }

    try {
      moderator = await itx.client.users.fetch(entry.moderator_id);
    } catch (err) {
      log.warn("blacklist case", `No se pudo obtener usuario moderator ${entry.moderator_id}:`, err.message);
      moderator = { id: entry.moderator_id, tag: "Moderador desconocido", username: "Moderador desconocido" };
    }

    const embed = createBlacklistEmbed(entry, target, moderator, locale);

    // Verificar que el embed no exceda los límites de Discord
    if (embed.data.description && embed.data.description.length > 4096) {
      log.error("blacklist case", `Embed description demasiado larga (${embed.data.description.length} chars) para entry #${caseId}`);
      return itx.reply({ 
        embeds: [createErrorEmbed(t(locale, "common.errors.unknown_error"), locale)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    return await itx.reply({ embeds: [embed] });
  } catch (error) {
    log.error("blacklist case", `Error al ejecutar comando blacklist case:`, error);
    console.error("[blacklist case] Error completo:", error);
    
    const locale = itx.guild ? await getLocaleForGuild(itx.guild) : DEFAULT_LOCALE;
    
    // Si la interacción no ha sido respondida, responder con error
    if (!itx.replied && !itx.deferred) {
      try {
        return await itx.reply({ 
          embeds: [createErrorEmbed(t(locale, "common.errors.unknown_error"), locale)], 
          flags: MessageFlags.Ephemeral 
        });
      } catch (replyError) {
        log.error("blacklist case", `Error al responder con mensaje de error:`, replyError);
      }
    }
  }
}

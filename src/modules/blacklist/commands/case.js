import * as BlacklistService from "../services/blacklist.service.js";
import * as PermService from "../../moderation/services/permissions.service.js";
import { createBlacklistEmbed, createErrorEmbed } from "../ui/embeds.js";
import { log } from "../../../core/logger/index.js";

export async function handle(itx) {
  try {
    if (!itx.inGuild()) {
      return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
    }

    const caseId = itx.options.getInteger("id", true);

    if (!await PermService.canExecuteCommand(itx.member, "blacklist.case")) {
      return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando")], ephemeral: true });
    }

    const entry = await BlacklistService.getEntry(itx.guild.id, caseId);
    if (!entry) {
      return itx.reply({ embeds: [createErrorEmbed(`Entry #${caseId} no encontrado`)], ephemeral: true });
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

    const embed = createBlacklistEmbed(entry, target, moderator);

    // Verificar que el embed no exceda los límites de Discord
    if (embed.data.description && embed.data.description.length > 4096) {
      log.error("blacklist case", `Embed description demasiado larga (${embed.data.description.length} chars) para entry #${caseId}`);
      return itx.reply({ 
        embeds: [createErrorEmbed(`El entry #${caseId} tiene demasiada información para mostrarse. Por favor, revisa los datos directamente en la base de datos.`)], 
        ephemeral: true 
      });
    }

    return await itx.reply({ embeds: [embed] });
  } catch (error) {
    log.error("blacklist case", `Error al ejecutar comando blacklist case:`, error);
    console.error("[blacklist case] Error completo:", error);
    
    // Si la interacción no ha sido respondida, responder con error
    if (!itx.replied && !itx.deferred) {
      try {
        return await itx.reply({ 
          embeds: [createErrorEmbed("Ocurrió un error al mostrar el entry. Por favor, intenta de nuevo.")], 
          ephemeral: true 
        });
      } catch (replyError) {
        log.error("blacklist case", `Error al responder con mensaje de error:`, replyError);
      }
    }
  }
}

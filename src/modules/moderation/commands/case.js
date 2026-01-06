import * as CasesService from "../services/cases.service.js";
import * as PermService from "../services/permissions.service.js";
import { createCaseEmbed, createErrorEmbed } from "../ui/embeds.js";
import { log } from "../../../core/logger/index.js";
import { getLocaleForGuild } from "../../../core/i18n/index.js";

export async function handle(itx) {
  try {
    if (!itx.inGuild()) {
      return itx.reply({ content: "Este comando solo funciona en servidores.", ephemeral: true });
    }

    const caseId = itx.options.getInteger("id", true);
    const locale = await getLocaleForGuild(itx.guild);

    if (!await PermService.canExecuteCommand(itx.member, "case")) {
      return itx.reply({ embeds: [createErrorEmbed("No tienes permisos para usar este comando", locale)], ephemeral: true });
    }

    const case_ = await CasesService.getCase(itx.guild.id, caseId);
    if (!case_) {
      return itx.reply({ embeds: [createErrorEmbed(`Case #${caseId} no encontrado`, locale)], ephemeral: true });
    }

    let target, moderator;
    try {
      target = await itx.client.users.fetch(case_.target_id);
    } catch (err) {
      log.warn("case", `No se pudo obtener usuario target ${case_.target_id}:`, err.message);
      target = { id: case_.target_id, tag: "Usuario desconocido", username: "Usuario desconocido" };
    }

    try {
      moderator = await itx.client.users.fetch(case_.moderator_id);
    } catch (err) {
      log.warn("case", `No se pudo obtener usuario moderator ${case_.moderator_id}:`, err.message);
      moderator = { id: case_.moderator_id, tag: "Moderador desconocido", username: "Moderador desconocido" };
    }

    const embed = createCaseEmbed(case_, target, moderator, locale);

    // Verificar que el embed no exceda los límites de Discord
    if (embed.data.description && embed.data.description.length > 4096) {
      log.error("case", `Embed description demasiado larga (${embed.data.description.length} chars) para case #${caseId}`);
      return itx.reply({ 
        embeds: [createErrorEmbed(`El case #${caseId} tiene demasiada información para mostrarse. Por favor, revisa los datos directamente en la base de datos.`, locale)], 
        ephemeral: true 
      });
    }

    return await itx.reply({ embeds: [embed] });
  } catch (error) {
    log.error("case", `Error al ejecutar comando case:`, error);
    console.error("[case] Error completo:", error);
    
    // Si la interacción no ha sido respondida, responder con error
    if (!itx.replied && !itx.deferred) {
      try {
        const locale = await getLocaleForGuild(itx.guild);
        return await itx.reply({ 
          embeds: [createErrorEmbed("Ocurrió un error al mostrar el case. Por favor, intenta de nuevo.", locale)], 
          ephemeral: true 
        });
      } catch (replyError) {
        log.error("case", `Error al responder con mensaje de error:`, replyError);
      }
    }
  }
}


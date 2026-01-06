/**
 * Servicio para enviar mensajes al modlog de forma consistente
 */

import * as SettingsRepo from "../db/settings.repo.js";
import { createModlogEmbed } from "../ui/embeds.js";
import { log } from "../../../core/logger/index.js";
import { sendLog } from "../../../core/webhooks/index.js";
import { getLocaleForGuild } from "../../../core/i18n/index.js";

/**
 * Envía un caso de moderación al canal de modlog
 * @param {Guild} guild - El servidor de Discord
 * @param {Object} case_ - El caso de moderación
 * @param {User} targetUser - El usuario objetivo (User object, no Member)
 * @param {User} moderatorUser - El moderador (User object)
 * @param {boolean|null} dmSent - Si se envió DM al usuario (opcional)
 * @returns {Promise<boolean>} - true si se envió correctamente, false si no
 */
export async function sendToModlog(guild, case_, targetUser, moderatorUser, dmSent = null) {
  try {
    const settings = await SettingsRepo.getGuildSettings(guild.id);
    
    if (!settings.modlog_channel_id) {
      return false; // No hay canal de modlog configurado, no es un error
    }

    const modlogChannel = await guild.channels.fetch(settings.modlog_channel_id).catch(() => null);
    
    if (!modlogChannel) {
      log.warn("modlog", `Canal de modlog ${settings.modlog_channel_id} no encontrado en ${guild.id}`);
      return false;
    }

    if (!modlogChannel.isTextBased()) {
      log.warn("modlog", `Canal de modlog ${settings.modlog_channel_id} no es un canal de texto en ${guild.id}`);
      return false;
    }

    const locale = await getLocaleForGuild(guild);
    const embed = createModlogEmbed(case_, targetUser, moderatorUser, dmSent, locale);
    await sendLog(modlogChannel, { embeds: [embed] }, "moderation");
    
    return true;
  } catch (error) {
    log.error("modlog", `Error al enviar a modlog en ${guild.id}:`, error);
    return false;
  }
}

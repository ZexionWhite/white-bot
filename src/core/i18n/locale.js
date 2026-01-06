/**
 * Sistema de detección y gestión de locale por guild
 */
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./loader.js";
import { log } from "../logger/index.js";

// Importación lazy para evitar dependencias circulares
let getGuildLocaleFromDB = null;
let getGuildSettings = null;

/**
 * Inicializa las funciones de DB (lazy loading)
 */
async function initDBFunctions() {
  if (!getGuildLocaleFromDB) {
    const settingsRepo = await import("../../modules/moderation/db/settings.repo.js");
    getGuildSettings = settingsRepo.getGuildSettings;
    
    // Función helper para obtener locale de DB
    getGuildLocaleFromDB = async (guildId) => {
      const settings = await getGuildSettings(guildId);
      return settings?.locale || null;
    };
  }
}

/**
 * Obtiene el locale para un guild
 * Orden de prioridad:
 * 1. DB (guild_settings.locale)
 * 2. Discord (guild.preferredLocale)
 * 3. Fallback (es-ES)
 * 
 * @param {import("discord.js").Guild} guild - Guild de Discord
 * @returns {Promise<string>} Locale (es-ES o en-US)
 */
export async function getLocaleForGuild(guild) {
  if (!guild) {
    return DEFAULT_LOCALE;
  }
  
  await initDBFunctions();
  
  try {
    // 1. Verificar DB
    const dbLocale = await getGuildLocaleFromDB(guild.id);
    if (dbLocale && SUPPORTED_LOCALES.includes(dbLocale)) {
      return dbLocale;
    }
  } catch (error) {
    log.debug("i18n", `Error getting locale from DB for guild ${guild.id}: ${error.message}`);
  }
  
  // 2. Verificar preferredLocale de Discord
  if (guild.preferredLocale) {
    const discordLocale = guild.preferredLocale;
    
    // Mapear locales de Discord a nuestros locales soportados
    if (discordLocale.startsWith("es")) {
      return "es-ES";
    } else if (discordLocale.startsWith("en")) {
      return "en-US";
    }
    
    // Si es otro locale de Discord que no soportamos, continuar al fallback
  }
  
  // 3. Fallback
  return DEFAULT_LOCALE;
}

/**
 * Obtiene el locale para un guild de forma síncrona (solo DB, sin Discord)
 * Útil cuando no se tiene acceso al objeto Guild
 * @param {string} guildId - ID del guild
 * @param {string} fallbackLocale - Locale de fallback (default: es-ES)
 * @returns {Promise<string>} Locale
 */
export async function getLocaleForGuildId(guildId, fallbackLocale = DEFAULT_LOCALE) {
  if (!guildId) {
    return fallbackLocale;
  }
  
  await initDBFunctions();
  
  try {
    const dbLocale = await getGuildLocaleFromDB(guildId);
    if (dbLocale && SUPPORTED_LOCALES.includes(dbLocale)) {
      return dbLocale;
    }
  } catch (error) {
    log.debug("i18n", `Error getting locale from DB for guild ${guildId}: ${error.message}`);
  }
  
  return fallbackLocale;
}

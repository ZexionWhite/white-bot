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
 * 1. DB (guild_settings.locale) - Configuración explícita del bot
 * 2. Fallback (es-ES) - Default absoluto
 * 
 * NOTA: No usa guild.preferredLocale porque el idioma del servidor Discord
 * puede ser diferente al idioma que queremos para el bot.
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
    // 1. Verificar DB (configuración explícita del bot)
    const dbLocale = await getGuildLocaleFromDB(guild.id);
    if (dbLocale && SUPPORTED_LOCALES.includes(dbLocale)) {
      return dbLocale;
    }
  } catch (error) {
    log.debug("i18n", `Error getting locale from DB for guild ${guild.id}: ${error.message}`);
  }
  
  // 2. Fallback al default (es-ES)
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

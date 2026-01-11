import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./loader.js";
import { log } from "../logger/index.js";

let getGuildLocaleFromDB = null;
let getGuildSettings = null;

async function initDBFunctions() {
  if (!getGuildLocaleFromDB) {
    const settingsRepo = await import("../../modules/moderation/db/settings.repo.js");
    getGuildSettings = settingsRepo.getGuildSettings;

    getGuildLocaleFromDB = async (guildId) => {
      const settings = await getGuildSettings(guildId);
      return settings?.locale || null;
    };
  }
}

export async function getLocaleForGuild(guild) {
  if (!guild) {
    return DEFAULT_LOCALE;
  }
  
  await initDBFunctions();
  
  try {
    
    const dbLocale = await getGuildLocaleFromDB(guild.id);
    if (dbLocale && SUPPORTED_LOCALES.includes(dbLocale)) {
      return dbLocale;
    }
  } catch (error) {
    log.debug("i18n", `Error getting locale from DB for guild ${guild.id}: ${error.message}`);
  }

  return DEFAULT_LOCALE;
}

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

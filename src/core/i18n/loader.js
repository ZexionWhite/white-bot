import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES_DIR = join(__dirname, "locales");

const translationsCache = new Map();

export const SUPPORTED_LOCALES = ["es-ES", "en-US"];
export const DEFAULT_LOCALE = "es-ES";

const TRANSLATION_MODULES = [
  "common",
  "moderation",
  "logging",
  "config",
  "blacklist",
  "info",
  "voice",
  "utilities"
];

function loadModule(locale, module) {
  const filePath = join(LOCALES_DIR, locale, `${module}.json`);
  
  if (!existsSync(filePath)) {
    log.warn("i18n", `Translation file not found: ${filePath}`);
    return {};
  }
  
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    log.error("i18n", `Error loading translation file ${filePath}: ${error.message}`);
    return {};
  }
}

function loadLocale(locale) {
  
  if (!SUPPORTED_LOCALES.includes(locale)) {
    log.warn("i18n", `Unsupported locale: ${locale}, falling back to ${DEFAULT_LOCALE}`);
    locale = DEFAULT_LOCALE;
  }

  if (translationsCache.has(locale)) {
    return translationsCache.get(locale);
  }

  const localeTranslations = new Map();
  
  for (const module of TRANSLATION_MODULES) {
    const translations = loadModule(locale, module);
    localeTranslations.set(module, translations);
  }

  translationsCache.set(locale, localeTranslations);
  log.debug("i18n", `Loaded locale: ${locale}`);
  
  return localeTranslations;
}

export function getTranslations(locale) {
  return loadLocale(locale);
}

export function getModuleTranslations(locale, module) {
  const localeTranslations = getTranslations(locale);
  return localeTranslations.get(module) || {};
}

export function clearCache() {
  translationsCache.clear();
  log.debug("i18n", "Translation cache cleared");
}

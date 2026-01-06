/**
 * Sistema de carga de traducciones
 * Cache en memoria para performance
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { log } from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES_DIR = join(__dirname, "locales");

/**
 * Cache de traducciones en memoria
 * Key: locale -> Map<module, translations>
 */
const translationsCache = new Map();

/**
 * Locales soportados
 */
export const SUPPORTED_LOCALES = ["es-ES", "en-US"];
export const DEFAULT_LOCALE = "es-ES";

/**
 * Módulos de traducción disponibles
 */
const TRANSLATION_MODULES = [
  "common",
  "moderation",
  "logging",
  "help",
  "config",
  "blacklist",
  "info",
  "voice",
  "utilities"
];

/**
 * Carga un módulo de traducción para un locale
 * @param {string} locale - Locale (es-ES, en-US)
 * @param {string} module - Nombre del módulo (common, moderation, etc.)
 * @returns {object} Objeto de traducciones o {}
 */
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

/**
 * Carga todas las traducciones de un locale
 * @param {string} locale - Locale a cargar
 * @returns {Map<string, object>} Map con módulo -> traducciones
 */
function loadLocale(locale) {
  // Validar locale
  if (!SUPPORTED_LOCALES.includes(locale)) {
    log.warn("i18n", `Unsupported locale: ${locale}, falling back to ${DEFAULT_LOCALE}`);
    locale = DEFAULT_LOCALE;
  }
  
  // Si ya está en cache, retornar
  if (translationsCache.has(locale)) {
    return translationsCache.get(locale);
  }
  
  // Cargar todos los módulos
  const localeTranslations = new Map();
  
  for (const module of TRANSLATION_MODULES) {
    const translations = loadModule(locale, module);
    localeTranslations.set(module, translations);
  }
  
  // Guardar en cache
  translationsCache.set(locale, localeTranslations);
  log.debug("i18n", `Loaded locale: ${locale}`);
  
  return localeTranslations;
}

/**
 * Obtiene traducciones de un locale (con cache)
 * @param {string} locale - Locale
 * @returns {Map<string, object>} Map de módulos
 */
export function getTranslations(locale) {
  return loadLocale(locale);
}

/**
 * Obtiene traducciones de un módulo específico
 * @param {string} locale - Locale
 * @param {string} module - Nombre del módulo
 * @returns {object} Traducciones del módulo
 */
export function getModuleTranslations(locale, module) {
  const localeTranslations = getTranslations(locale);
  return localeTranslations.get(module) || {};
}

/**
 * Limpia el cache de traducciones (útil para testing o hot-reload)
 */
export function clearCache() {
  translationsCache.clear();
  log.debug("i18n", "Translation cache cleared");
}

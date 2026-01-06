/**
 * Función principal de traducción t()
 * Soporta interpolación, keys anidadas y fallbacks
 */
import { getModuleTranslations, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./loader.js";
import { log } from "../logger/index.js";

/**
 * Obtiene un valor anidado de un objeto usando notación de puntos
 * @param {object} obj - Objeto
 * @param {string} path - Path con notación de puntos (ej: "embeds.warn.title")
 * @returns {any} Valor encontrado o undefined
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  
  const keys = path.split(".");
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Interpola variables en un string
 * @param {string} template - Template con {variable}
 * @param {object} params - Objeto con valores
 * @returns {string} String interpolado
 */
function interpolate(template, params) {
  if (typeof template !== "string") {
    return template;
  }
  
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Función principal de traducción
 * @param {string} locale - Locale (es-ES, en-US)
 * @param {string} key - Key de traducción (ej: "moderation.embeds.warn.title")
 * @param {object} params - Parámetros para interpolación
 * @returns {string} Texto traducido
 */
export function t(locale, key, params = {}) {
  // Validar locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }
  
  // Parsear key: módulo.ruta.completa
  const parts = key.split(".");
  if (parts.length < 2) {
    log.warn("i18n", `Invalid translation key format: ${key} (should be module.path.to.key)`);
    return key;
  }
  
  const module = parts[0];
  const path = parts.slice(1).join(".");
  
  // Intentar obtener traducción del locale solicitado
  let value = getNestedValue(getModuleTranslations(locale, module), path);
  
  // Fallback a default locale si no se encuentra
  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = getNestedValue(getModuleTranslations(DEFAULT_LOCALE, module), path);
  }
  
  // Si aún no existe, usar la key como fallback y loggear
  if (value === undefined) {
    log.warn("i18n", `Missing translation: ${locale}:${key}`);
    return key;
  }
  
  // Interpolar variables
  return interpolate(value, params);
}

/**
 * Obtiene múltiples traducciones a la vez
 * @param {string} locale - Locale
 * @param {string[]} keys - Array de keys
 * @param {object} params - Parámetros compartidos
 * @returns {object} Objeto con key -> traducción
 */
export function tMultiple(locale, keys, params = {}) {
  const result = {};
  for (const key of keys) {
    result[key] = t(locale, key, params);
  }
  return result;
}

import { getModuleTranslations, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./loader.js";
import { log } from "../logger/index.js";

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

function interpolate(template, params) {
  if (typeof template !== "string") {
    return template;
  }
  
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function t(locale, key, params = {}) {
  
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  const parts = key.split(".");
  if (parts.length < 2) {
    log.warn("i18n", `Invalid translation key format: ${key} (should be module.path.to.key)`);
    return key;
  }
  
  const module = parts[0];
  const path = parts.slice(1).join(".");

  let value = getNestedValue(getModuleTranslations(locale, module), path);

  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = getNestedValue(getModuleTranslations(DEFAULT_LOCALE, module), path);
  }

  if (value === undefined) {
    log.warn("i18n", `Missing translation: ${locale}:${key}`);
    return key;
  }

  return interpolate(value, params);
}

export function tMultiple(locale, keys, params = {}) {
  const result = {};
  for (const key of keys) {
    result[key] = t(locale, key, params);
  }
  return result;
}

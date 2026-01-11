import { log } from "../logger/index.js";
import { BotError } from "./base.error.js";

export async function handleError(fn, context, defaultValue = null) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof BotError) {
      log.error(context, `${error.name} (${error.code}):`, error.message);
    } else {
      log.error(context, "Error inesperado:", error.message, error.stack);
    }
    return defaultValue;
  }
}

export async function handleErrorAndThrow(fn, context) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof BotError) {
      log.error(context, `${error.name} (${error.code}):`, error.message);
    } else {
      log.error(context, "Error inesperado:", error.message);
    }
    throw error;
  }
}

export function normalizeError(error, code = "UNKNOWN_ERROR") {
  if (error instanceof BotError) {
    return error;
  }
  const botError = new BotError(error.message || "Error desconocido", code);
  botError.stack = error.stack;
  return botError;
}

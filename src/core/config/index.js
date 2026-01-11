import "dotenv/config";
import { z } from "zod";
import { ConfigError } from "../errors/index.js";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN es requerido"),
  CLIENT_ID: z.string().min(1, "CLIENT_ID es requerido"),
  GUILD_ID_PRUEBA: z.string().optional(),
  AVATARS_DIR: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  DATABASE_URL: z.string().url().optional(),
  DB_PROVIDER: z.enum(["sqlite", "postgres"]).default("sqlite"),
  
  REDIS_URL: z.string().optional(),
  USE_REDIS: z.union([z.string().transform(val => val === "true"), z.boolean()]).optional().default(false)
});

let validatedEnv = null;

export function loadConfig() {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join(".")}: ${err.message}`
      ).join("\n");
      
      throw new ConfigError(
        `Error de validación de configuración:\n${errors}`
      );
    }
    throw new ConfigError(`Error al cargar configuración: ${error.message}`);
  }
}

export function getEnv(key) {
  const config = loadConfig();
  return config[key];
}

export function getConfig() {
  return loadConfig();
}

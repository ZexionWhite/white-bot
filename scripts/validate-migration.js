#!/usr/bin/env node
/**
 * Script para validar la migración comparando SQLite y PostgreSQL
 * 
 * Uso: node scripts/validate-migration.js
 */

import Database from "better-sqlite3";
import pg from "pg";
const { Client } = pg;
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { getEnv } from "../src/core/config/index.js";

const TABLES = [
  "guild_settings",
  "color_roles",
  "cooldowns",
  "voice_sessions",
  "user_stats",
  "mod_cases",
  "mod_policy",
  "voice_activity",
  "message_log",
  "blacklist",
  "pending_actions"
];

async function validateMigration() {
  const dbPath = path.join(process.cwd(), "data", "bot.db");
  const databaseUrl = getEnv("DATABASE_URL");

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Base de datos SQLite no encontrada: ${dbPath}`);
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL no está configurada");
    process.exit(1);
  }

  console.log("🔍 Validando migración SQLite → PostgreSQL\n");

  const sqliteDb = new Database(dbPath);
  const pgClient = new Client({ connectionString: databaseUrl });

  try {
    await pgClient.connect();

    let allMatch = true;

    for (const table of TABLES) {
      try {
        // Contar en SQLite
        const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
        
        // Contar en PostgreSQL
        const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
        const pgCount = parseInt(pgResult.rows[0].count);

        const match = sqliteCount === pgCount;
        const icon = match ? "✅" : "❌";
        
        console.log(`${icon} ${table}:`);
        console.log(`   SQLite: ${sqliteCount} registros`);
        console.log(`   PostgreSQL: ${pgCount} registros`);
        
        if (!match) {
          console.log(`   ⚠️  Diferencia: ${Math.abs(sqliteCount - pgCount)} registros`);
          allMatch = false;
        }

        // Verificar algunas filas de ejemplo (solo para tablas pequeñas)
        if (sqliteCount > 0 && sqliteCount <= 100) {
          const sqliteRows = sqliteDb.prepare(`SELECT * FROM ${table} LIMIT 5`).all();
          const pgRows = (await pgClient.query(`SELECT * FROM ${table} LIMIT 5`)).rows;
          
          if (sqliteRows.length !== pgRows.length) {
            console.log(`   ⚠️  Diferencias en filas de ejemplo`);
            allMatch = false;
          }
        }

      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
        allMatch = false;
      }
    }

    console.log("\n" + "=".repeat(60));
    if (allMatch) {
      console.log("✅ Validación exitosa: todas las tablas coinciden");
    } else {
      console.log("⚠️  Validación completada con diferencias");
      console.log("   Revisa los detalles arriba");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

validateMigration().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Script para importar datos desde JSON (exportado de SQLite) a PostgreSQL
 * 
 * Uso: node scripts/import-postgres.js [export.json] [--truncate]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
const { Client } = pg;
import "dotenv/config";
import { getEnv } from "../src/core/config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRUNCATE = process.argv.includes("--truncate");

// Orden de importación (respetar dependencias si las hay)
const IMPORT_ORDER = [
  "guild_settings",
  "color_roles",
  "cooldowns",
  "voice_sessions",
  "user_stats",
  "mod_policy",
  "mod_cases",
  "voice_activity",
  "message_log",
  "blacklist",
  "pending_actions"
];

async function importData(client, tableName, rows) {
  if (rows.length === 0) {
    console.log(`  ⏭️  ${tableName}: sin datos`);
    return;
  }

  if (TRUNCATE) {
    await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
  }

  // Construir INSERT dinámico según las columnas de la primera fila
  const firstRow = rows[0];
  const columns = Object.keys(firstRow);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let imported = 0;
  for (const row of rows) {
    const values = columns.map(col => {
      const val = row[col];
      // Convertir undefined a null
      if (val === undefined) return null;
      return val;
    });

    try {
      await client.query(sql, values);
      imported++;
    } catch (error) {
      console.warn(`    ⚠️  Error insertando fila en ${tableName}:`, error.message);
    }
  }

  console.log(`  ✅ ${tableName}: ${imported}/${rows.length} registros importados`);
}

async function importPostgres() {
  const databaseUrl = getEnv("DATABASE_URL");
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL no está configurada en .env");
    process.exit(1);
  }

  const exportFile = process.argv[2] || path.join(process.cwd(), "data", "export", "export.json");
  
  if (!fs.existsSync(exportFile)) {
    console.error(`❌ Archivo de exportación no encontrado: ${exportFile}`);
    console.error("   Ejecuta primero: node scripts/export-sqlite.js");
    process.exit(1);
  }

  console.log(`📂 Archivo de exportación: ${exportFile}`);
  console.log(`🔌 Conectando a PostgreSQL...`);

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("✅ Conectado a PostgreSQL");

    const exportData = JSON.parse(fs.readFileSync(exportFile, "utf-8"));

    if (TRUNCATE) {
      console.log("🗑️  Modo TRUNCATE: se eliminarán datos existentes");
    }

    console.log("\n📥 Importando datos...");
    
    await client.query("BEGIN");

    for (const table of IMPORT_ORDER) {
      if (exportData[table]) {
        await importData(client, table, exportData[table]);
      } else {
        console.log(`  ⚠️  ${table}: tabla no encontrada en export`);
      }
    }

    await client.query("COMMIT");
    console.log("\n✅ Importación completada");

    // Validación: contar registros
    console.log("\n📊 Validación (conteo de registros):");
    for (const table of IMPORT_ORDER) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: error al contar (${error.message})`);
      }
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante la importación:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Conexión cerrada");
  }
}

importPostgres().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

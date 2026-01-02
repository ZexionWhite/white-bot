#!/usr/bin/env node
/**
 * Script para migrar el esquema de SQLite a PostgreSQL
 * Ejecuta el archivo de migración en la base de datos PostgreSQL
 * 
 * Uso: node scripts/migrate-schema.js [--dry-run]
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

const DRY_RUN = process.argv.includes("--dry-run");

async function migrateSchema() {
  const databaseUrl = getEnv("DATABASE_URL");
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL no está configurada en .env");
    console.error("   Ejemplo: DATABASE_URL=postgresql://user:pass@host:5432/dbname");
    process.exit(1);
  }

  const migrationFile = path.join(__dirname, "..", "migrations", "001_initial_schema.sql");
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Archivo de migración no encontrado: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, "utf-8");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN - No se ejecutarán cambios");
    console.log("\nSQL a ejecutar:");
    console.log("=".repeat(60));
    console.log(sql);
    console.log("=".repeat(60));
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    console.log("🔌 Conectando a PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado a PostgreSQL");

    console.log("📝 Ejecutando migración...");
    await client.query(sql);
    console.log("✅ Migración ejecutada exitosamente");

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log("\n📊 Tablas creadas:");
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error("❌ Error durante la migración:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Conexión cerrada");
  }
}

migrateSchema().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

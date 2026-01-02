#!/usr/bin/env node
/**
 * Script para exportar datos de SQLite a JSON
 * Útil para migración de datos a PostgreSQL
 * 
 * Uso: node scripts/export-sqlite.js [output-dir]
 */

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function exportTable(db, tableName) {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    return rows;
  } catch (error) {
    console.warn(`⚠️  No se pudo exportar ${tableName}:`, error.message);
    return [];
  }
}

async function exportSQLite() {
  const dbPath = path.join(process.cwd(), "data", "bot.db");
  const outputDir = process.argv[2] || path.join(process.cwd(), "data", "export");
  
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Base de datos SQLite no encontrada: ${dbPath}`);
    process.exit(1);
  }

  console.log(`📂 Base de datos: ${dbPath}`);
  console.log(`📤 Directorio de salida: ${outputDir}`);

  // Crear directorio de salida
  fs.mkdirSync(outputDir, { recursive: true });

  // Hacer backup del SQLite
  const backupPath = path.join(outputDir, `backup_${Date.now()}.db`);
  console.log(`💾 Creando backup: ${backupPath}`);
  fs.copyFileSync(dbPath, backupPath);

  const db = new Database(dbPath);
  const exportData = {};

  console.log("\n📊 Exportando tablas...");
  
  for (const table of TABLES) {
    console.log(`  Exportando ${table}...`);
    const rows = exportTable(db, table);
    exportData[table] = rows;
    console.log(`    ✅ ${rows.length} registros`);
  }

  // Guardar JSON
  const jsonPath = path.join(outputDir, "export.json");
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), "utf-8");
  console.log(`\n✅ Datos exportados a: ${jsonPath}`);

  // Guardar resumen
  const summary = {
    exportDate: new Date().toISOString(),
    backupPath: path.basename(backupPath),
    tables: Object.keys(exportData).map(table => ({
      name: table,
      rowCount: exportData[table].length
    }))
  };
  
  const summaryPath = path.join(outputDir, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`📄 Resumen guardado en: ${summaryPath}`);

  db.close();
  console.log("\n✅ Exportación completada");
}

exportSQLite().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

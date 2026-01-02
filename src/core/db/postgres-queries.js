/**
 * Queries SQL específicas para PostgreSQL
 * Contiene versiones convertidas de queries SQLite específicas
 */

/**
 * Convierte INSERT OR REPLACE de SQLite a INSERT ... ON CONFLICT DO UPDATE de PostgreSQL
 * @param {string} table - Nombre de la tabla
 * @param {Array<string>} columns - Array de nombres de columnas
 * @param {Array<string>} conflictColumns - Columnas de la PRIMARY KEY o UNIQUE constraint
 * @returns {string} Query SQL para PostgreSQL
 */
export function buildInsertOrReplacePostgres(table, columns, conflictColumns) {
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const updateClause = columns
    .filter(col => !conflictColumns.includes(col))
    .map(col => `${col} = EXCLUDED.${col}`)
    .join(", ");
  
  return `
    INSERT INTO ${table} (${columns.join(", ")}) 
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumns.join(", ")}) 
    DO UPDATE SET ${updateClause || "guild_id = EXCLUDED.guild_id"}
  `.trim();
}

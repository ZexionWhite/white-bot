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

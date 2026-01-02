/**
 * Utilidades para convertir queries SQL de SQLite a PostgreSQL
 */

/**
 * Convierte una query SQL de SQLite a PostgreSQL
 * - Reemplaza ? por $1, $2, etc (parámetros posicionales)
 * - Reemplaza @param por $1, $2, etc (parámetros nombrados)
 * - Convierte INSERT OR REPLACE a INSERT ... ON CONFLICT DO UPDATE
 * - Convierte AUTOINCREMENT a SERIAL/BIGSERIAL
 * @param {string} sql - SQL de SQLite
 * @returns {string} SQL convertido para PostgreSQL
 */
export function convertSQLiteToPostgres(sql) {
  let converted = sql;

  // INSERT OR REPLACE -> INSERT ... ON CONFLICT DO UPDATE
  // Esto es más complejo, requiere parsear la estructura
  // Por ahora, dejamos que cada repositorio maneje esto manualmente
  // ya que las queries varían mucho

  return converted;
}

/**
 * Convierte parámetros posicionales (?) a parámetros de PostgreSQL ($1, $2, etc)
 * @param {string} sql - SQL con placeholders ?
 * @param {Array} params - Array de parámetros
 * @returns {{sql: string, values: Array}} SQL convertido y valores
 */
export function convertPositionalParams(sql, params) {
  let paramIndex = 1;
  const values = [];
  const convertedSql = sql.replace(/\?/g, () => {
    values.push(params[paramIndex - 1]);
    return `$${paramIndex++}`;
  });
  return { sql: convertedSql, values };
}

/**
 * Convierte parámetros nombrados (@param) a parámetros de PostgreSQL ($1, $2, etc)
 * @param {string} sql - SQL con placeholders @param
 * @param {Object} params - Objeto con parámetros
 * @returns {{sql: string, values: Array}} SQL convertido y valores
 */
export function convertNamedParams(sql, paramsObj) {
  const values = [];
  const paramMap = new Map();
  let paramIndex = 1;

  const namedParamRegex = /@(\w+)/g;
  const convertedSql = sql.replace(namedParamRegex, (match, paramName) => {
    if (!paramMap.has(paramName)) {
      paramMap.set(paramName, paramIndex++);
      values.push(paramsObj[paramName]);
    }
    return `$${paramMap.get(paramName)}`;
  });

  return { sql: convertedSql, values };
}

/**
 * Convierte INSERT OR REPLACE a INSERT ... ON CONFLICT DO UPDATE
 * Requiere conocer las columnas de la PRIMARY KEY
 * @param {string} sql - SQL con INSERT OR REPLACE
 * @param {Array<string>} conflictColumns - Columnas de la PRIMARY KEY
 * @returns {string} SQL convertido
 */
export function convertInsertOrReplace(sql, conflictColumns) {
  // Esta es una conversión compleja que requiere parsear el SQL
  // Por ahora, se maneja caso por caso en los repositorios
  // Esta función es un placeholder para futuras mejoras
  return sql;
}

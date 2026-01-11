export function convertSQLiteToPostgres(sql) {
  let converted = sql;

  return converted;
}

export function convertPositionalParams(sql, params) {
  let paramIndex = 1;
  const values = [];
  const convertedSql = sql.replace(/\?/g, () => {
    values.push(params[paramIndex - 1]);
    return `$${paramIndex++}`;
  });
  return { sql: convertedSql, values };
}

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

export function convertInsertOrReplace(sql, conflictColumns) {

  return sql;
}

/**
 * Interfaz genérica para drivers de base de datos
 * Define el contrato que deben implementar todos los drivers (SQLite, PostgreSQL, etc.)
 */

/**
 * @typedef {Object} PreparedStatement
 * @property {Function} run - Ejecuta una query que no retorna resultados (INSERT, UPDATE, DELETE)
 * @property {Function} get - Ejecuta una query y retorna un solo resultado (SELECT con LIMIT 1)
 * @property {Function} all - Ejecuta una query y retorna todos los resultados (SELECT)
 */

/**
 * Interfaz para drivers de base de datos
 */
export class DatabaseDriver {
  /**
   * Prepara una statement para ejecución posterior
   * @param {string} sql - Query SQL a preparar
   * @returns {PreparedStatement} Statement preparado
   */
  prepare(sql) {
    throw new Error("DatabaseDriver.prepare() must be implemented");
  }

  /**
   * Ejecuta una query SQL directamente (sin preparar)
   * Útil para DDL statements (CREATE TABLE, ALTER TABLE, etc.)
   * @param {string} sql - Query SQL a ejecutar
   * @returns {void}
   */
  exec(sql) {
    throw new Error("DatabaseDriver.exec() must be implemented");
  }

  /**
   * Inicia una transacción
   * @returns {Transaction} Objeto de transacción
   */
  transaction(callback) {
    throw new Error("DatabaseDriver.transaction() must be implemented");
  }

  /**
   * Cierra la conexión a la base de datos
   * @returns {Promise<void>}
   */
  close() {
    throw new Error("DatabaseDriver.close() must be implemented");
  }
}

/**
 * Interfaz para prepared statements
 */
export class PreparedStatement {
  /**
   * Ejecuta la statement y no retorna resultados
   * @param {...any} params - Parámetros para la query
   * @returns {Object|undefined} Resultado de la ejecución (puede incluir lastInsertRowid, changes, etc.)
   */
  run(...params) {
    throw new Error("PreparedStatement.run() must be implemented");
  }

  /**
   * Ejecuta la statement y retorna un solo resultado
   * @param {...any} params - Parámetros para la query
   * @returns {Object|undefined} Un solo registro o undefined si no hay resultados
   */
  get(...params) {
    throw new Error("PreparedStatement.get() must be implemented");
  }

  /**
   * Ejecuta la statement y retorna todos los resultados
   * @param {...any} params - Parámetros para la query
   * @returns {Array<Object>} Array de registros
   */
  all(...params) {
    throw new Error("PreparedStatement.all() must be implemented");
  }
}

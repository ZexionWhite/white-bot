export class DatabaseDriver {

  prepare(sql) {
    throw new Error("DatabaseDriver.prepare() must be implemented");
  }

  exec(sql) {
    throw new Error("DatabaseDriver.exec() must be implemented");
  }

  transaction(callback) {
    throw new Error("DatabaseDriver.transaction() must be implemented");
  }

  close() {
    throw new Error("DatabaseDriver.close() must be implemented");
  }
}

export class PreparedStatement {

  run(...params) {
    throw new Error("PreparedStatement.run() must be implemented");
  }

  get(...params) {
    throw new Error("PreparedStatement.get() must be implemented");
  }

  all(...params) {
    throw new Error("PreparedStatement.all() must be implemented");
  }
}

import { Table } from '../types'

export class Database {
  private databases = new Map<string, Database>()
  private currentDb: Database | null = null
  private currentDbName: string | null = null
  private tables = new Map<string, Table>()

  createDatabase(name: string) {
    if (this.databases.has(name)) {
      throw new Error(`Database ${name} already exists`)
    }
    this.databases.set(name, new Database())
  }

  dropDatabase(name: string) {
    if (!this.databases.has(name)) {
      throw new Error(`Database ${name} does not exist`)
    }
    if (this.currentDbName === name) {
      this.currentDb = null
      this.currentDbName = null
    }
    this.databases.delete(name)
  }

  useDatabase(name: string) {
    const db = this.databases.get(name)
    if (!db) {
      throw new Error(`Database ${name} does not exist`)
    }
    this.currentDb = db
    this.currentDbName = name
  }

  getCurrentDatabase(): Database {
    if (!this.currentDb) {
      throw new Error('No database selected. Use USE <database> first.')
    }
    return this.currentDb
  }

  getCurrentDatabaseName(): string {
    if (!this.currentDbName) {
      throw new Error('No database selected. Use USE <database> first.')
    }
    return this.currentDbName
  }

  listDatabases(): string[] {
    return Array.from(this.databases.keys())
  }

  createTable(table: Table) {
    if (this.tables.has(table.name)) {
      throw new Error(`Table ${table.name} already exists`)
    }
    this.tables.set(table.name, table)
  }

  dropTable(name: string) {
    if (!this.tables.has(name)) {
      throw new Error(`Table ${name} does not exist`)
    }
    this.tables.delete(name)
  }

  getTable(name: string): Table {
    const table = this.tables.get(name)
    if (!table) {
      throw new Error(`Table ${name} does not exist`)
    }
    return table
  }

  listTables(): string[] {
    return Array.from(this.tables.keys())
  }
}

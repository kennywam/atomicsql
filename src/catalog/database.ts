import { Table } from "../types";

export class Database {
  private tables = new Map<string, Table>();

  createTable(table: Table) {
    if (this.tables.has(table.name)) {
      throw new Error(`Table ${table.name} already exists`);
    }
    this.tables.set(table.name, table);
  }

  getTable(name: string): Table {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} does not exist`);
    }
    return table;
  }

  listTables(): string[] {
    return Array.from(this.tables.keys());
  }
}

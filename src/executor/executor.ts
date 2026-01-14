import { Database } from '../catalog/database'
import {
  CreateTableStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  SelectStatement,
  DropTableStatement,
  CreateDatabaseStatement,
  DropDatabaseStatement,
  UseDatabaseStatement,
  DescribeTableStatement,
} from '../interfaces'
import { Table, Row } from '../types'

export class Executor {
  constructor(private dbManager: Database) {}

  execute(statement: any) {
    switch (statement.type) {
      case 'CREATE_DATABASE':
        return this.createDatabase(statement)

      case 'DROP_DATABASE':
        return this.dropDatabase(statement)

      case 'USE_DATABASE':
        return this.useDatabase(statement)

      case 'LIST_DATABASES':
        return this.listDatabases()

      case 'SHOW_TABLES':
        return this.showTables()

      case 'DESCRIBE_TABLE':
        return this.describeTable(statement)

      case 'CREATE_TABLE':
        return this.createTable(statement)

      case 'DROP_TABLE':
        return this.dropTable(statement)

      case 'INSERT':
        return this.insert(statement)

      case 'UPDATE':
        return this.update(statement)

      case 'DELETE':
        return this.delete(statement)

      case 'SELECT':
        return this.select(statement)

      default:
        throw new Error('Unsupported statement')
    }
  }

  private createTable(stmt: CreateTableStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table: Table = {
      name: stmt.tableName,
      columns: stmt.columns,
      rows: [],
      indexes: new Map(),
    }

    db.createTable(table)
    return `Table '${stmt.tableName}' created`
  }

  private insert(stmt: InsertStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    if (stmt.values.length !== table.columns.length) {
      throw new Error('Column count does not match values count')
    }

    const row: Row = new Map()

    table.columns.forEach((col: any, i: number) => {
      const value = stmt.values[i]

      if (col.type === 'INT' && typeof value !== 'number') {
        throw new Error(`Column ${col.name} expects INT`)
      }
      if (col.type === 'TEXT' && typeof value !== 'string') {
        throw new Error(`Column ${col.name} expects TEXT`)
      }

      if (col.primaryKey || col.unique) {
        for (const existingRow of table.rows) {
          if (existingRow.get(col.name) === value) {
            throw new Error(
              `Duplicate value for ${
                col.primaryKey ? 'PRIMARY KEY' : 'UNIQUE'
              } column '${col.name}'`
            )
          }
        }
      }

      row.set(col.name, value)
    })

    table.rows.push(row)
    return '1 row inserted'
  }

  private select(stmt: SelectStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    let filteredRows = table.rows

    if (stmt.whereClause) {
      filteredRows = table.rows.filter((row) => {
        const value = row.get(stmt.whereClause!.column)
        const whereValue = stmt.whereClause!.value

        const numValue =
          typeof value === 'number'
            ? value
            : typeof value === 'string' && !isNaN(Number(value))
            ? Number(value)
            : value
        const numWhereValue =
          typeof whereValue === 'number'
            ? whereValue
            : typeof whereValue === 'string' && !isNaN(Number(whereValue))
            ? Number(whereValue)
            : whereValue

        switch (stmt.whereClause!.operator) {
          case '=':
            return numValue === numWhereValue
          case '!=':
            return numValue !== numWhereValue
          case '>':
            return numValue > numWhereValue
          case '<':
            return numValue < numWhereValue
          case '>=':
            return numValue >= numWhereValue
          case '<=':
            return numValue <= numWhereValue
          default:
            return false
        }
      })
    }

    return filteredRows.map((row) => {
      const result: any = {}
      if (stmt.columns.includes('*')) {
        // Return all columns for SELECT *
        table.columns.forEach((column) => {
          result[column.name] = row.get(column.name)
        })
      } else {
        // Return specific columns
        stmt.columns.forEach((column) => {
          result[column] = row.get(column)
        })
      }
      return result
    })
  }

  private createDatabase(stmt: CreateDatabaseStatement) {
    this.dbManager.createDatabase(stmt.name)
    return `Database '${stmt.name}' created`
  }

  private dropDatabase(stmt: DropDatabaseStatement) {
    this.dbManager.dropDatabase(stmt.name)
    return `Database '${stmt.name}' dropped`
  }

  private useDatabase(stmt: UseDatabaseStatement) {
    this.dbManager.useDatabase(stmt.name)
    return `Using database '${stmt.name}'`
  }

  private listDatabases() {
    return this.dbManager.listDatabases()
  }

  private showTables() {
    const db = this.dbManager.getCurrentDatabase()
    return db.listTables()
  }

  private describeTable(stmt: DescribeTableStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)
    return table.columns
  }

  private dropTable(stmt: DropTableStatement) {
    const db = this.dbManager.getCurrentDatabase()
    db.dropTable(stmt.tableName)
    return `Table '${stmt.tableName}' dropped`
  }

  private update(stmt: UpdateStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    let updatedCount = 0

    table.rows.forEach((row) => {
      let matches = true

      if (stmt.whereClause) {
        const value = row.get(stmt.whereClause.column)
        const whereValue = stmt.whereClause.value

        // Convert to numbers for comparison if both are numeric
        const numValue =
          typeof value === 'number'
            ? value
            : typeof value === 'string' && !isNaN(Number(value))
            ? Number(value)
            : value
        const numWhereValue =
          typeof whereValue === 'number'
            ? whereValue
            : typeof whereValue === 'string' && !isNaN(Number(whereValue))
            ? Number(whereValue)
            : whereValue

        switch (stmt.whereClause.operator) {
          case '=':
            matches = numValue === numWhereValue
            break
          case '!=':
            matches = numValue !== numWhereValue
            break
          case '>':
            matches = numValue > numWhereValue
            break
          case '<':
            matches = numValue < numWhereValue
            break
          case '>=':
            matches = numValue >= numWhereValue
            break
          case '<=':
            matches = numValue <= numWhereValue
            break
        }
      }

      if (matches) {
        row.set(stmt.columnName, stmt.value)
        updatedCount++
      }
    })

    return `${updatedCount} row(s) updated`
  }

  private delete(stmt: DeleteStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    const originalLength = table.rows.length

    if (stmt.whereClause) {
      table.rows = table.rows.filter((row) => {
        const value = row.get(stmt.whereClause!.column)
        const whereValue = stmt.whereClause!.value

        const numValue =
          typeof value === 'number'
            ? value
            : typeof value === 'string' && !isNaN(Number(value))
            ? Number(value)
            : value
        const numWhereValue =
          typeof whereValue === 'number'
            ? whereValue
            : typeof whereValue === 'string' && !isNaN(Number(whereValue))
            ? Number(whereValue)
            : whereValue

        switch (stmt.whereClause!.operator) {
          case '=':
            return numValue !== numWhereValue
          case '!=':
            return numValue !== numWhereValue
          case '>':
            return numValue <= numWhereValue
          case '<':
            return numValue >= numWhereValue
          case '>=':
            return numValue < numWhereValue
          case '<=':
            return numValue > numWhereValue
          default:
            return true
        }
      })
    } else {
      table.rows = []
    }

    const deletedCount = originalLength - table.rows.length
    return `${deletedCount} row(s) deleted`
  }
}

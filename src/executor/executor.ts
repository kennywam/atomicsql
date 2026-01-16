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
  CreateIndexStatement,
  DropIndexStatement,
} from '../interfaces'
import { Table, Row } from '../types'
import { HashIndex } from '../index/hash-index'

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

      case 'CREATE_INDEX':
        return this.createIndex(statement)

      case 'DROP_INDEX':
        return this.dropIndex(statement)

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

    const rowId = table.rows.length - 1
    table.columns.forEach((column) => {
      if (table.indexes.has(column.name)) {
        const index = table.indexes.get(column.name)!
        const value = row.get(column.name)
        index.add(value, rowId)
      }
    })

    return '1 row inserted'
  }

  private select(stmt: SelectStatement) {
    const db = this.dbManager.getCurrentDatabase()

    if (stmt.joinClause) {
      return this.selectWithJoin(stmt, db)
    }

    const table = db.getTable(stmt.tableName)

    let filteredRows: Row[]

    if (stmt.whereClause) {
      if (
        stmt.whereClause.operator === '=' &&
        table.indexes.has(stmt.whereClause.column)
      ) {
        const index = table.indexes.get(stmt.whereClause.column)!
        const value = stmt.whereClause.value
        const rowIds = index.get(value) || []
        filteredRows = rowIds
          .map((rowId) => table.rows[rowId])
          .filter((row) => row !== undefined)
      } else {
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
    } else {
      filteredRows = table.rows
    }

    return filteredRows.map((row) => {
      const result: any = {}
      if (stmt.columns.includes('*')) {
        table.columns.forEach((column) => {
          result[column.name] = row.get(column.name)
        })
      } else {
        stmt.columns.forEach((column) => {
          result[column] = row.get(column)
        })
      }
      return result
    })
  }

  private selectWithJoin(stmt: SelectStatement, db: Database) {
    const leftTable = db.getTable(stmt.joinClause!.leftTable)
    const rightTable = db.getTable(stmt.joinClause!.rightTable)

    const results: any[] = []

    for (const leftRow of leftTable.rows) {
      for (const rightRow of rightTable.rows) {
        const leftValue = leftRow.get(stmt.joinClause!.leftColumn)
        const rightValue = rightRow.get(stmt.joinClause!.rightColumn)

        if (leftValue === rightValue) {
          const joinedRow: any = {}

          if (stmt.columns.includes('*')) {
            leftTable.columns.forEach((column) => {
              joinedRow[`${stmt.joinClause!.leftTable}.${column.name}`] =
                leftRow.get(column.name)
            })
            rightTable.columns.forEach((column) => {
              joinedRow[`${stmt.joinClause!.rightTable}.${column.name}`] =
                rightRow.get(column.name)
            })
          } else {
            stmt.columns.forEach((column) => {
              if (column.includes('.')) {
                const [tableName, columnName] = column.split('.')
                if (tableName === stmt.joinClause!.leftTable) {
                  joinedRow[column] = leftRow.get(columnName!)
                } else if (tableName === stmt.joinClause!.rightTable) {
                  joinedRow[column] = rightRow.get(columnName!)
                }
              } else {
                const leftValue = leftRow.get(column)
                const rightValue = rightRow.get(column)
                if (leftValue !== undefined) {
                  joinedRow[column] = leftValue
                } else if (rightValue !== undefined) {
                  joinedRow[column] = rightValue
                }
              }
            })
          }

          if (stmt.whereClause) {
            let matches = false
            const whereValue = stmt.whereClause.value

            for (const [key, value] of Object.entries(joinedRow)) {
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
                  matches = (numValue as any) === numWhereValue
                  break
                case '!=':
                  matches = (numValue as any) !== numWhereValue
                  break
                case '>':
                  matches = (numValue as any) > numWhereValue
                  break
                case '<':
                  matches = (numValue as any) < numWhereValue
                  break
                case '>=':
                  matches = (numValue as any) >= numWhereValue
                  break
                case '<=':
                  matches = (numValue as any) <= numWhereValue
                  break
              }

              if (matches) break
            }

            if (matches) {
              results.push(joinedRow)
            }
          } else {
            results.push(joinedRow)
          }
        }
      }
    }

    return results
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

  private createIndex(stmt: CreateIndexStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    const columnExists = table.columns.some(
      (col) => col.name === stmt.columnName
    )
    if (!columnExists) {
      throw new Error(
        `Column '${stmt.columnName}' does not exist in table '${stmt.tableName}'`
      )
    }

    if (!table.indexes.has(stmt.columnName)) {
      table.indexes.set(stmt.columnName, new HashIndex())
    }

    const index = table.indexes.get(stmt.columnName)!
    index.rebuild(table.rows, stmt.columnName)

    return `Index '${stmt.indexName}' created on column '${stmt.columnName}'`
  }

  private dropIndex(stmt: DropIndexStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const tables = db.listTables()

    for (const tableName of tables) {
      const table = db.getTable(tableName)
      for (const [columnName, index] of table.indexes.entries()) {
        table.indexes.delete(columnName)
        return `Index '${stmt.indexName}' dropped`
      }
    }

    throw new Error(`Index '${stmt.indexName}' does not exist`)
  }

  private update(stmt: UpdateStatement) {
    const db = this.dbManager.getCurrentDatabase()
    const table = db.getTable(stmt.tableName)

    let updatedCount = 0

    table.rows.forEach((row, rowId) => {
      let matches = true

      if (stmt.whereClause) {
        const value = row.get(stmt.whereClause.column)
        const whereValue = stmt.whereClause.value

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
        if (table.indexes.has(stmt.columnName)) {
          const index = table.indexes.get(stmt.columnName)!
          const oldValue = row.get(stmt.columnName)

          index.remove(oldValue, rowId)

          const newValue = stmt.value
          index.add(newValue, rowId)
        }

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
      const rowsToDelete: number[] = []

      table.rows.forEach((row, rowId) => {
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

        let shouldDelete = false
        switch (stmt.whereClause!.operator) {
          case '=':
            shouldDelete = numValue === numWhereValue
            break
          case '!=':
            shouldDelete = numValue !== numWhereValue
            break
          case '>':
            shouldDelete = numValue > numWhereValue
            break
          case '<':
            shouldDelete = numValue < numWhereValue
            break
          case '>=':
            shouldDelete = numValue >= numWhereValue
            break
          case '<=':
            shouldDelete = numValue <= numWhereValue
            break
        }

        if (shouldDelete) {
          rowsToDelete.push(rowId)
        }
      })

      rowsToDelete.reverse().forEach((rowId) => {
        table.rows.splice(rowId, 1)
      })

      table.indexes.forEach((index, columnName) => {
        index.rebuild(table.rows, columnName)
      })
    } else {
      table.rows = []
      table.indexes.forEach((index) => index.clear())
    }

    const deletedCount = originalLength - table.rows.length
    return `${deletedCount} row(s) deleted`
  }
}

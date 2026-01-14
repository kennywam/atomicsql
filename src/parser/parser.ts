import {
  CreateTableStatement,
  DropTableStatement,
  InsertStatement,
  UpdateStatement,
  DeleteStatement,
  SelectStatement,
  CreateDatabaseStatement,
  DropDatabaseStatement,
  UseDatabaseStatement,
  ListDatabasesStatement,
  ShowTablesStatement,
  DescribeTableStatement,
} from '../interfaces'
import { Column, DataType } from '../types'

function parseValues(raw: string): any[] {
  return raw.split(',').map((v) => {
    const value = v.trim()
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1)
    }
    if (!isNaN(Number(value))) {
      return Number(value)
    }
    return value
  })
}

function parseWhereClause(whereStr: string): any {
  const operators = ['>=', '<=', '!=', '=', '>', '<']

  for (const op of operators) {
    if (whereStr.includes(op)) {
      const parts = whereStr.split(op).map((s) => s.trim())
      if (parts.length === 2) {
        const [column, value] = parts
        const cleanValue = value!.replace(/;$/, '')
        const parsedValues = parseValues(cleanValue)
        return {
          column,
          operator: op as any,
          value: parsedValues.length > 0 ? parsedValues[0] : null,
        }
      }
    }
  }

  throw new Error('Invalid WHERE clause')
}

export function parse(
  input: string
):
  | CreateTableStatement
  | DropTableStatement
  | InsertStatement
  | UpdateStatement
  | DeleteStatement
  | SelectStatement
  | CreateDatabaseStatement
  | DropDatabaseStatement
  | UseDatabaseStatement
  | ListDatabasesStatement
  | ShowTablesStatement
  | DescribeTableStatement
  | null {
  const createDbRegex = /^CREATE\s+DATABASE\s+(\w+);?$/i
  const dropDbRegex = /^DROP\s+DATABASE\s+(\w+);?$/i
  const useDbRegex = /^USE\s+(\w+);?$/i
  const listDbRegex = /^SHOW\s+DATABASES;?$/i
  const showTablesRegex = /^SHOW\s+TABLES;?$/i
  const describeTableRegex = /^DESCRIBE\s+(\w+);?$/i
  const createTableRegex = /^CREATE\s+TABLE\s+(\w+)\s*\((.+)\);?$/i
  const dropTableRegex = /^DROP\s+TABLE\s+(\w+);?$/i
  const insertRegex = /^INSERT\s+INTO\s+(\w+)\s+VALUES\s*\((.+)\);?$/i
  const updateRegex =
    /^UPDATE\s+(\w+)\s+SET\s+(\w+)\s*=\s*(.+?)(?:\s+WHERE\s+(.+))?;?$/i
  const deleteRegex = /^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?;?$/i
  const selectRegex = /^SELECT\s+(.+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?;?$/i

  let match = input.match(createDbRegex)
  if (match && match[1]) {
    return {
      type: 'CREATE_DATABASE',
      name: match[1],
    }
  }

  match = input.match(useDbRegex)
  if (match && match[1]) {
    return {
      type: 'USE_DATABASE',
      name: match[1],
    }
  }

  match = input.match(dropDbRegex)
  if (match && match[1]) {
    return {
      type: 'DROP_DATABASE',
      name: match[1],
    }
  }

  match = input.match(listDbRegex)
  if (match) {
    return {
      type: 'LIST_DATABASES',
    }
  }

  match = input.match(showTablesRegex)
  if (match) {
    return {
      type: 'SHOW_TABLES',
    }
  }

  match = input.match(describeTableRegex)
  if (match && match[1]) {
    return {
      type: 'DESCRIBE_TABLE',
      tableName: match[1],
    }
  }

  match = input.match(dropTableRegex)
  if (match && match[1]) {
    return {
      type: 'DROP_TABLE',
      tableName: match[1],
    }
  }

  match = input.match(updateRegex)
  if (match && match[1] && match[2] && match[3]) {
    const whereClause = match[4] ? parseWhereClause(match[4]) : undefined
    return {
      type: 'UPDATE',
      tableName: match[1],
      columnName: match[2],
      value: parseValues(match[3])[0],
      whereClause,
    }
  }

  match = input.match(deleteRegex)
  if (match && match[1]) {
    const whereClause = match[2] ? parseWhereClause(match[2]) : undefined
    return {
      type: 'DELETE',
      tableName: match[1],
      whereClause,
    }
  }

  match = input.match(selectRegex)
  if (match && match[1] && match[2]) {
    const whereClause = match[3] ? parseWhereClause(match[3]) : undefined
    return {
      type: 'SELECT',
      columns: match[1].split(',').map((col) => col.trim()),
      tableName: match[2],
      whereClause,
    }
  }

  match = input.match(createTableRegex)
  if (match) {
    const tableName = match[1]
    const columnsDef = match[2]

    if (!tableName) {
      throw new Error('No table name defined in CREATE TABLE statement')
    }

    const columns: Column[] = columnsDef!.split(',').map((col) => {
      const parts = col.trim().split(/\s+/)

      const name = parts[0]
      const typeStr = parts[1]?.toUpperCase()

      const validTypes: DataType[] = ['INT', 'TEXT']
      if (typeStr && !validTypes.includes(typeStr as DataType)) {
        throw new Error(
          `Invalid data type: ${typeStr}. Valid types are: ${validTypes.join(
            ', '
          )}`
        )
      }

      const type = typeStr as DataType

      const column: Column = {
        name: name!,
        type,
        primaryKey: parts.includes('PRIMARY'),
        unique: parts.includes('UNIQUE'),
      }

      return column
    })

    return {
      type: 'CREATE_TABLE',
      tableName,
      columns,
    }
  }

  match = input.match(insertRegex)
  if (match && match[1] && match[2]) {
    return {
      type: 'INSERT',
      tableName: match[1],
      values: parseValues(match[2]),
    }
  }

  return null
}

import { Column } from './types'

export interface CreateTableStatement {
  type: 'CREATE_TABLE'
  tableName: string
  columns: Column[]
}

export interface DropTableStatement {
  type: 'DROP_TABLE'
  tableName: string
}

export interface InsertStatement {
  type: 'INSERT'
  tableName: string
  values: any[]
}

export interface UpdateStatement {
  type: 'UPDATE'
  tableName: string
  columnName: string
  value: any
  whereClause?: WhereClause
}

export interface DeleteStatement {
  type: 'DELETE'
  tableName: string
  whereClause?: WhereClause
}

export interface SelectStatement {
  type: 'SELECT'
  columns: string[]
  tableName: string
  whereClause?: WhereClause
}

export interface CreateDatabaseStatement {
  type: 'CREATE_DATABASE'
  name: string
}

export interface DropDatabaseStatement {
  type: 'DROP_DATABASE'
  name: string
}

export interface UseDatabaseStatement {
  type: 'USE_DATABASE'
  name: string
}

export interface ListDatabasesStatement {
  type: 'LIST_DATABASES'
}

export interface ShowTablesStatement {
  type: 'SHOW_TABLES'
}

export interface DescribeTableStatement {
  type: 'DESCRIBE_TABLE'
  tableName: string
}

export interface WhereClause {
  column: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<='
  value: any
}

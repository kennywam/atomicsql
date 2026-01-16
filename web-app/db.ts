import { Executor } from '../src/executor/executor'
import { Database } from '../src/catalog/database'
import { parse } from '../src/parser/parser'

const dbManager = new Database()
const executor = new Executor(dbManager)

// Initialize database and table
let isInitialized = false

function initializeDatabase() {
  if (isInitialized) return

  try {
    console.log('Initializing database...')

    // Create database
    const createDbResult = parse('CREATE DATABASE appdb')
    if (createDbResult) {
      try {
        executor.execute(createDbResult)
        console.log('Database appdb created')
      } catch (e: any) {
        if (!e.message.includes('already exists')) {
          throw e
        }
        console.log('Database appdb already exists')
      }
    }

    // Use database
    const useDbResult = parse('USE appdb')
    if (useDbResult) {
      executor.execute(useDbResult)
      console.log('Using database appdb')
    }

    // Create table
    const createTableResult = parse(
      'CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE, age INT);'
    )
    if (createTableResult) {
      try {
        executor.execute(createTableResult)
        console.log('Table employees created')
      } catch (e: any) {
        if (!e.message.includes('already exists')) {
          console.error('Table creation failed:', e)
          throw e
        }
        console.log('Table employees already exists')
      }
    } else {
      console.error('Failed to parse CREATE TABLE statement')
    }

    // Verify table exists
    try {
      const listTablesResult = parse('SHOW TABLES;')
      if (listTablesResult) {
        const tables = executor.execute(listTablesResult)
        console.log('Available tables:', tables)
      }
    } catch (e) {
      console.log('Could not list tables:', e)
    }

    isInitialized = true
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

export function execute(sql: string) {
  initializeDatabase()

  const statement = parse(sql)
  if (!statement) {
    throw new Error('Invalid SQL')
  }

  try {
    const result = executor.execute(statement)
    return result
  } catch (error) {
    console.error('SQL execution error:', error)
    throw error
  }
}

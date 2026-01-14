# AtomicSQL

A simple RDBMS implementation in TypeScript with hash-based indexing support.

## Features

- **Database Management**: CREATE, USE, DROP, SHOW databases
- **Table Management**: CREATE, DROP, SHOW tables with column constraints
- **Data Operations**: INSERT, UPDATE, DELETE, SELECT with WHERE clauses
- **Hash Indexes**: Simple hash indexes for fast equality lookups
- **Data Types**: INT and TEXT data types with PRIMARY KEY and UNIQUE constraints

## Indexes

AtomicSQL supports simple hash indexes for fast equality lookups:

**Equality predicates use hash indexes when available, otherwise a full scan is performed.**

### Supported Index Operations

```sql
-- Create an index
CREATE INDEX idx_email ON employees(email);

-- Drop an index
DROP INDEX idx_email;
```

### Index Behavior

- **Fast Lookups**: Equality predicates (`WHERE column = value`) use hash indexes when available
- **Full Table Scan**: Non-equality predicates (`>`, `<`, `>=`, `<=`, `!=`) always use full table scan
- **Automatic Updates**: Indexes are automatically updated on INSERT, UPDATE, and DELETE operations
- **Single Column**: Only single-column indexes are supported
- **Hash Structure**: Uses `HashIndex` class with `Map<value, number[]>` for O(1) lookups

### Example

```sql
CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, email TEXT);
CREATE INDEX idx_email ON employees(email);

-- Uses hash index (fast lookup)
SELECT * FROM employees WHERE email = 'john@company.com';

-- Uses full table scan (no index or non-equality operator)
SELECT * FROM employees WHERE name = 'John Doe';
SELECT * FROM employees WHERE age > 25;
```

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the project:

   ```bash
   pnpm build
   ```

3. Run the project:
   ```bash
   pnpm start
   ```

## Development

- Watch mode for development:

  ```bash
  pnpm dev
  ```

- Clean build artifacts:
  ```bash
  pnpm clean
  ```

## Project Structure

- `src/` - TypeScript source code
  - `catalog/` - Database and table management
  - `executor/` - SQL statement execution
  - `parser/` - SQL parsing logic
  - `index/` - Hash index implementation
- `dist/` - Compiled JavaScript output
- `tsconfig.json` - TypeScript configuration

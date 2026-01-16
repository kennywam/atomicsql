# AtomicSQL

AtomicSQL is a **from-scratch relational database management system (RDBMS)** implemented in TypeScript.  
It is designed as a **teaching-style(basic) database engine** that focuses on correctness, clarity, and core relational concepts rather than production-level optimizations.

The system supports SQL-like commands via an interactive REPL, enforces relational constraints, implements hash-based indexing and joins, and includes a small web application that consumes the database as its only data store.

## Design Goals & Non-Goals

- Implement core relational database concepts from first principles
- Maintain a clear separation between parsing, execution, and storage
- Prioritize correctness and readability over performance
- Provide a SQL-like interface familiar to MySQL/Postgres users
- Demonstrate real-world consumption of database via a web application

## Non-Goals

- Full SQL standard compliance
- Query optimization or cost-based planning
- Transaction isolation, MVCC, or crash recovery
- Distributed or concurrent execution
- Advanced index structures (e.g. B-Trees)

These trade-offs are intentional and aligned with scope of challenge.

## Features

- **Database Management**: CREATE, USE, DROP, SHOW databases
- **Table Management**: CREATE, DROP, SHOW tables with column constraints
- **Data Operations**: INSERT, UPDATE, DELETE, SELECT with WHERE clauses
- **Hash Indexes**: Simple hash indexes for fast equality lookups
- **INNER JOINs**: Basic nested-loop join implementation
- **Data Types**: INT and TEXT data types with PRIMARY KEY and UNIQUE constraints

## Indexes

AtomicSQL supports **single-column hash indexes** for fast equality lookups.

When evaluating `WHERE` clauses:

- Equality predicates use a hash index when available
- All other predicates fall back to a full table scan

### Supported Operations

```sql
CREATE INDEX idx_email ON employees(email);
DROP INDEX idx_email;
```

### Index Characteristics

- Hash-based structure: `Map<value, number[]>`
- O(1) average-case lookup for equality predicates
- Automatically maintained on INSERT, UPDATE, and DELETE
- One index per column (no composite indexes)

### Example

```sql
-- Uses hash index
SELECT * FROM employees WHERE email = 'john@company.com';

-- Uses full table scan
SELECT * FROM employees WHERE age > 25;
```

## JOINs

AtomicSQL supports basic INNER JOIN operations using nested-loop join.

**Joins are implemented using a nested-loop join to keep the execution model simple and transparent.**

### Supported JOIN Syntax

```sql
SELECT employees.name, departments.name
FROM employees
JOIN departments ON employees.dept_id = departments.id;
```

### JOIN Features

- **INNER JOIN Only**: Only inner joins are supported
- **Nested Loop Algorithm**: Simple O(n×m) nested loop implementation
- **Table-Qualified Columns**: Use `table.column` notation for disambiguation
- **WHERE Support**: JOINs can be combined with WHERE clauses
- **Virtual Result Set**: Joined rows are not stored, only returned as results

### JOIN Examples

```sql
-- Basic JOIN with specific columns
SELECT employees.name, departments.name
FROM employees
JOIN departments ON employees.dept_id = departments.id;

-- JOIN with all columns
SELECT *
FROM employees
JOIN departments ON employees.dept_id = departments.id;

-- JOIN with WHERE clause
SELECT employees.name, departments.location
FROM employees
JOIN departments ON employees.dept_id = departments.id
WHERE departments.name = 'Engineering';
```

### Limitations

- No table aliases
- No multiple JOINs in single query
- No OUTER JOINs
- No self-joins
- No JOIN conditions other than equality

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

## Testing the RDBMS

### 1. Testing with REPL (Interactive Database)

Start the interactive REPL to test SQL commands directly:

```bash
pnpm db
```

**Example REPL Session:**

```sql
CREATE DATABASE testdb;
USE testdb;
CREATE TABLE users (id INT PRIMARY KEY, name TEXT, email TEXT);
INSERT INTO users VALUES (1, 'John Doe', 'john@example.com');
SELECT * FROM users;
SHOW TABLES;
SHOW DATABASES;
```

**Comprehensive Test Suite:**
Execute the full test suite for systematic validation:

```bash
pnpm db < test-statements.sql
```

This tests:

- Database creation, usage, and deletion
- Table creation with constraints and indexes
- Data manipulation (INSERT, UPDATE, DELETE)
- Index creation and usage verification
- Constraint enforcement (PRIMARY KEY, UNIQUE)
- JOIN operations across multiple tables

### 2. Testing with Web Application

Start the enhanced web application to test CRUD operations through a browser interface:

```bash
pnpm web
```

Then visit `http://localhost:3000` in your browser to:

- Add employees through the form
- View real-time statistics dashboard
- Search and filter employees
- Edit and delete records
- Test all CRUD operations

### 3. Running Test SQL Statements

Execute the comprehensive test suite:

```bash
pnpm db < test-statements.sql
```

This tests:

- Index creation and usage
- JOIN operations
- Constraint enforcement
- Error handling

## Web Application Demo

The web application exists solely to demonstrate that AtomicSQL can be consumed programmatically as a real database engine, not as a frontend showcase.

### Running the Web Application

1. Start the demonstration web application:

   ```bash
   pnpm web
   ```

2. Open your browser and navigate to `http://localhost:3000`

### Web Application Architecture

The demonstration web application consists of:

- **web-app/db.ts** - Bridge layer that wraps the RDBMS and provides an `execute(sql)` function
- **web-app/server.ts** - Express API server with REST endpoints for employee CRUD operations
- **web-app/public/index.html** - Minimal UI focused on functionality, not aesthetics

### Key Features Demonstrated

- **Pure RDBMS Integration**: The web app uses only the custom RDBMS as its data store
- **SQL String Interface**: All database operations go through `db.execute("SQL STRING")`
- **No External Dependencies**: No SQLite, Postgres, or other database systems
- **Clean Separation**: Clear separation between web layer and database engine

### API Endpoints

- `GET /employees` - List all employees
- `POST /employees` - Add a new employee
- `PUT /employees/:id` - Update an employee
- `DELETE /employees/:id` - Delete an employee
- `GET /health` - Health check endpoint

Each endpoint executes raw SQL strings that are parsed and executed by the custom RDBMS engine.

## How to Evaluate This Project

Reviewers are encouraged to:

1. **Start the REPL** and explore DDL/DML support with basic SQL commands
2. **Create indexes** and verify their usage via equality predicates vs full table scans
3. **Execute JOIN queries** across multiple tables to test relational operations
4. **Run the web application** and confirm that all data operations flow through the custom RDBMS
5. **Review the code structure** to see the clear separation between parsing, execution, indexing, and storage

No external database system is used at any point in the system.

-- Database Management Tests
CREATE DATABASE testdb;
USE testdb;
SHOW DATABASES;
DROP DATABASE testdb;
SHOW DATABASES;

-- Table Management Tests
CREATE DATABASE company;
USE company;
CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE, age INT);
SHOW TABLES;
DESCRIBE employees;

-- Create indexes before inserting data
CREATE INDEX idx_email ON employees(email);
CREATE INDEX idx_age ON employees(age);

-- Data Manipulation Tests
INSERT INTO employees VALUES (1, 'John Doe', 'john@company.com', 30);
INSERT INTO employees VALUES (2, 'Jane Smith', 'jane@company.com', 25);
INSERT INTO employees VALUES (3, 'Bob Johnson', 'bob@company.com', 35);
INSERT INTO employees VALUES (4, 'Alice Brown', 'alice@company.com', 28);
INSERT INTO employees VALUES (5, 'Charlie Wilson', 'charlie@company.com', 32);

-- SELECT Tests
SELECT * FROM employees;
SELECT name, email FROM employees;

-- Index Tests: Equality lookups (should use hash index)
SELECT * FROM employees WHERE email = 'john@company.com';  -- Uses idx_email
SELECT * FROM employees WHERE age = 30;                  -- Uses idx_age
SELECT * FROM employees WHERE age = 25;                  -- Uses idx_age
SELECT * FROM employees WHERE email = 'alice@company.com'; -- Uses idx_email

-- Non-indexed lookups (should use full table scan)
SELECT * FROM employees WHERE name = 'Jane Smith';        -- No index on name
SELECT * FROM employees WHERE age > 25;                   -- Non-equality operator
SELECT * FROM employees WHERE email != 'john@company.com'; -- Non-equality operator
SELECT * FROM employees WHERE age >= 30;                  -- Non-equality operator
SELECT * FROM employees WHERE age <= 25;                  -- Non-equality operator

-- UPDATE Tests (index maintenance)
UPDATE employees SET age = 31 WHERE id = 1;              -- Updates idx_age
UPDATE employees SET email = 'jane.smith@company.com' WHERE name = 'Jane Smith'; -- Updates idx_email
UPDATE employees SET name = 'Robert Johnson' WHERE age = 35; -- No index update needed

-- Verify indexes still work after updates
SELECT * FROM employees WHERE email = 'jane.smith@company.com'; -- Should find updated email
SELECT * FROM employees WHERE age = 31;                  -- Should find updated age

-- DELETE Tests (index rebuild)
DELETE FROM employees WHERE id = 3;                      -- Rebuilds all indexes
DELETE FROM employees WHERE age < 30;                     -- Rebuilds all indexes

-- Verify indexes still work after deletes
SELECT * FROM employees WHERE email = 'bob@company.com';  -- Should return empty
SELECT * FROM employees WHERE age = 25;                   -- Should return empty
SELECT * FROM employees WHERE email = 'john@company.com'; -- Should still work

-- Test index creation on existing data
CREATE INDEX idx_name ON employees(name);
SELECT * FROM employees WHERE name = 'John Doe';          -- Now uses idx_name

-- DROP INDEX Tests
DROP INDEX idx_age;
SELECT * FROM employees WHERE age = 31;                  -- Should now use full table scan
SELECT * FROM employees WHERE email = 'john@company.com'; -- Should still use idx_email

-- JOIN Tests
CREATE DATABASE company;
USE company;

-- Create tables for JOIN testing
CREATE TABLE departments (id INT PRIMARY KEY, name TEXT, location TEXT);
CREATE TABLE employeesdt (id INT PRIMARY KEY, name TEXT, dept_id INT, salary INT);

-- Insert test data
INSERT INTO departments VALUES (1, 'Engineering', 'Building A');
INSERT INTO departments VALUES (2, 'Marketing', 'Building B');
INSERT INTO departments VALUES (3, 'Sales', 'Building C');

INSERT INTO employeesdt VALUES (1, 'Alice', 1, 80000);
INSERT INTO employeesdt VALUES (2, 'Bob', 2, 70000);
INSERT INTO employeesdt VALUES (3, 'Charlie', 1, 90000);
INSERT INTO employeesdt VALUES (4, 'Diana', 3, 75000);
INSERT INTO employeesdt VALUES (5, 'Eve', 2, 72000);

-- Basic INNER JOIN tests
SELECT employeesdt.name, departments.name FROM employeesdt JOIN departments ON employeesdt.dept_id = departments.id;

-- JOIN with table-qualified columns
SELECT employeesdt.name, departments.location FROM employeesdt JOIN departments ON employeesdt.dept_id = departments.id;

-- JOIN with all columns (*)
SELECT * FROM employeesdt JOIN departments ON employeesdt.dept_id = departments.id;

-- JOIN with WHERE clause
SELECT employeesdt.name, departments.name FROM employeesdt JOIN departments ON employeesdt.dept_id = departments.id WHERE departments.name = 'Engineering';

-- JOIN with numeric comparison in WHERE
SELECT employeesdt.name, departments.name FROM employeesdt JOIN departments ON employeesdt.dept_id = departments.id WHERE employeesdt.salary > 75000;


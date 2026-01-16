import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { execute } from './db'

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

function validateEmployee(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { id, name, email, age } = req.body

  if (!id || !name || !email || !age) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (typeof id !== 'number' || id <= 0) {
    return res.status(400).json({ error: 'ID must be a positive number' })
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' })
  }

  if (
    typeof email !== 'string' ||
    !email.includes('@') ||
    !email.includes('.')
  ) {
    return res.status(400).json({ error: 'Valid email address is required' })
  }

  if (typeof age !== 'number' || age < 18 || age > 100) {
    return res.status(400).json({ error: 'Age must be between 18 and 100' })
  }

  next()
}

app.get('/employees', (_, res) => {
  try {
    const result = execute('SELECT * FROM employees;')
    res.json(result)
  } catch (e: any) {
    console.error('GET /employees error:', e)
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

app.post('/employees', validateEmployee, (req, res) => {
  const { id, name, email, age } = req.body
  try {
    execute(
      `INSERT INTO employees VALUES (${id}, '${name}', '${email}', ${age});`
    )
    res.json({ success: true, message: 'Employee added successfully' })
  } catch (e: any) {
    console.error('POST /employees error:', e)
    if (e.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Employee ID or email already exists' })
    } else if (e.message.includes('PRIMARY KEY constraint failed')) {
      res.status(409).json({ error: 'Employee ID already exists' })
    } else {
      res.status(400).json({ error: 'Failed to add employee' })
    }
  }
})

app.put('/employees/:id', (req, res) => {
  const { id } = req.params
  const { name, email, age } = req.body

  if (!name && !email && !age) {
    return res
      .status(400)
      .json({ error: 'At least one field must be provided for update' })
  }

  try {
    if (name) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res
          .status(400)
          .json({ error: 'Name must be at least 2 characters' })
      }
      execute(`UPDATE employees SET name = '${name}' WHERE id = ${id};`)
    }

    if (email) {
      if (
        typeof email !== 'string' ||
        !email.includes('@') ||
        !email.includes('.')
      ) {
        return res
          .status(400)
          .json({ error: 'Valid email address is required' })
      }
      execute(`UPDATE employees SET email = '${email}' WHERE id = ${id};`)
    }

    if (age) {
      if (typeof age !== 'number' || age < 18 || age > 100) {
        return res.status(400).json({ error: 'Age must be between 18 and 100' })
      }
      execute(`UPDATE employees SET age = ${age} WHERE id = ${id};`)
    }

    res.json({ success: true, message: 'Employee updated successfully' })
  } catch (e: any) {
    console.error('PUT /employees error:', e)
    if (e.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Email already exists' })
    } else if (e.message.includes('No employee found')) {
      res.status(404).json({ error: 'Employee not found' })
    } else {
      res.status(400).json({ error: 'Failed to update employee' })
    }
  }
})

app.delete('/employees/:id', (req, res) => {
  try {
    const result = execute(`DELETE FROM employees WHERE id = ${req.params.id};`)
    const checkResult = execute(
      `SELECT * FROM employees WHERE id = ${req.params.id};`
    )
    if (Array.isArray(checkResult) && checkResult.length > 0) {
      return res.status(500).json({ error: 'Failed to delete employee' })
    }
    res.json({ success: true, message: 'Employee deleted successfully' })
  } catch (e: any) {
    console.error('DELETE /employees error:', e)
    res.status(400).json({ error: 'Failed to delete employee' })
  }
})

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(
  (err: any, res: express.Response) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Employee Management System running at http://localhost:${PORT}`)
  console.log('Powered by Custom RDBMS Engine')
})

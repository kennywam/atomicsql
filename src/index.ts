import { startRepl } from './repl/repl'
import { parse } from './parser/parser'
import { Executor } from './executor/executor'
import { Database } from './catalog/database'

const dbManager = new Database()
const executor = new Executor(dbManager)

startRepl((input) => {
  try {
    const statement = parse(input)
    if (!statement) {
      console.log('Invalid or unsupported SQL')
      return
    }

    const result = executor.execute(statement)
    console.log(result)
  } catch (err: any) {
    console.error('Error:', err.message)
  }
})

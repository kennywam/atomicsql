import * as readline from 'readline'

export function startRepl(onCommand: (input: string) => void) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'atomicSQL> ',
  })

  rl.prompt()

  rl.on('line', (line: string) => {
    const input = line.trim()
    if (input === 'exit' || input === 'quit') {
      rl.close()
      return
    }
    onCommand(input)
    rl.prompt()
  })

  rl.on('close', () => {
    console.log('Goodbye!')
    process.exit(0)
  })
}

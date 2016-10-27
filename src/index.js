// to add colors in console
require('colors')

const globalCommands = [
  'configure',
  'create',
  'exec',
  'deploy',
  'init',
  'install',
  'kill',
  'log',
  'run',
  'specify'
]
const globalModules = globalCommands.map(command => require(`./commands/${command}`))

class Teleport {
  constructor (program) {
    // bind methods from sub modules
    globalModules.forEach(module =>
      Object.keys(module).forEach(key =>
        this[key] = module[key].bind(this))
    )
    // call init
    this.init(program)
  }

  start () {
    // welcome
    console.log('\n\n** Welcome to teleport node-side ! **\n'.black.bold.bgCyan)
    // we can pass args to the cli, either object, or direct values or nothing
    this.kwarg = null
    if (typeof this.program.kwarg === 'string') {
      this.kwarg = this.program.kwarg[0] === '{'
      ? JSON.parse(this.program.kwarg)
      : this.program.kwarg
    }
    // it is maye a generic global task
    const programmedCommand = globalCommands.find(command => this.program[command])
    if (this[programmedCommand]) {
      this[programmedCommand]()
      return
    }
    // default return
    this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !')
  }

  checkProject () {
    if (typeof this.projectDir !== 'string') {
      this.consoleWarn('you need to go inside a project for this command')
      process.exit()
    }
  }

  consoleLog (string) {
    console.log(string.blue)
  }

  consoleInfo (string) {
    console.log(string.green)
  }

  consoleWarn (string) {
    console.warn(string.yellow)
  }

  consoleError (string) {
    console.err(string.red)
  }

}

module.exports = Teleport

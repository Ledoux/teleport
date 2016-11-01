// regeneratorRuntime is needed for async await
import 'babel-polyfill'

const methods = [
  'add',
  'console',
  'check',
  'create',
  'deploy',
  'exec',
  'get',
  'init',
  'install',
  'kill',
  'log',
  'map',
  'read',
  'set',
  'start',
  'status',
  'write'
]
const subModules = methods.map(method => require(`./methods/${method}`))

class Teleport {
  constructor (program) {
    // welcome
    console.log('\n\n** Welcome to teleport node-side ! **\n'.bold)
    // bind methods from sub modules
    subModules.forEach(module =>
      Object.keys(module).forEach(key =>
        this[key] = module[key].bind(this))
    )
    // call init
    this.init(program)
  }

  launch () {
    // unpack
    const { program } = this
    // we can pass args to the cli, either object, or direct values or nothing
    this.kwarg = null
    if (typeof program.kwarg === 'string') {
      this.kwarg = program.kwarg[0] === '{'
      ? JSON.parse(program.kwarg)
      : program.kwarg
    }
    // it is maye a generic global task
    const programmedMethod = methods.find(method => program[method])
    if (this[programmedMethod]) {
      this[programmedMethod]()
      return
    }
    // default return
    this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !')
  }

  pass () {}
}

export default Teleport

// regeneratorRuntime is needed for async await
import 'babel-polyfill'

const methods = [
  'configure',
  'console',
  'check',
  'create',
  'deploy',
  'dump',
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
  'write',
  'zsh'
]
const subModules = methods.map(method => require(`./methods/${method}`))
const collectionNames = ['servers', 'types']

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
    this.program = program
    const app = this.app = {}
    this.setAppEnvironment()
    this.level = null // has to be after either scope or project
    const project = this.project = {}
    // determine where we are
    this.currentDir = process.cwd()
    // if we are inside of the app folder itself better is to leave, because
    // we don't have anything to do here
    this.isAppDir = this.currentDir === app.dir.replace(/\/$/, '')
    if (this.isAppDir) {
      this.consoleWarn(`You are in the ${app.package.name} folder... Better is to exit :)`)
      process.exit()
    }
    // if we want to create something, then we return because we are not in a scope or in a project yet
    if (typeof program.create !== 'undefined') {
      this.level = ['project'].find(level => program[level])
      return
    }
    // if it is not a create method, it means that we are either in a scope or in a
    // project to do something
    this.currentConfig = this.getConfig(this.currentDir)
    // split given where we are
    if (this.currentConfig || typeof this.program.init !== 'undefined') {
      this.level = 'project'
      project.dir = this.currentDir
      this.setProjectEnvironment()
    }
    // exit else
    if (!this.level) {
      // this.consoleWarn('You neither are in a scope folder or in a project folder')
      this.consoleWarn('You are not in a project folder')
      process.exit()
    }
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
    // it is maybe a generic global task
    const programmedMethod = methods.find(method => program[method])
    if (this[programmedMethod]) {
      // check for mapping ? let's see if there is already a collections
      // arg defined
      if (typeof program.collections === 'undefined') {
        // so there is no clear mapping to collections
        // but maybe there are some pluralized args
        // suggesting that the method has to be done
        // with a map protocol
        const collectionSlugs = []
        collectionNames.forEach(collectionName => {
          const value = program[collectionName]
          if (typeof value === 'string') {
            if (value === 'all') {
              collectionSlugs.push(`${collectionName}ByName`)
            } else {
              collectionSlugs.push(`${collectionName}ByName[${value}]`)
            }
          }
        })
        const collections = collectionSlugs.join('|')
        // if collections is not empty, so yes, it is mapping
        // method request, do it and return in that case
        if (collections !== '') {
          program.collections = collections
          program.method = programmedMethod
          this.map()
          return
        }
      }
      // if no collection, it is a simple unit call
      // call it
      this[programmedMethod]()
      return
    }
    // default return
    this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !')
  }

  pass () {}
}

export default Teleport

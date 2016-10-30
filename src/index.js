// regeneratorRuntime is needed for async await
import 'babel-polyfill'
import 'colors'
import fs from 'fs'
import { merge } from 'lodash'
import path from 'path'

import { getPackage } from './utils'

const globalCommands = [
  'configure',
  'create',
  'exec',
  'deploy',
  'init',
  'install',
  'kill',
  'log',
  'run'
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
    console.log('\n\n** Welcome to teleport node-side ! **\n'.bold)
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
    const programmedCommand = globalCommands.find(command => program[command])
    if (this[programmedCommand]) {
      this[programmedCommand]()
      return
    }
    // default return
    this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !')
  }

  getConfig (dir) {
    const { app: { package: {name} } } = this
    let config
    // check first for some attributes in package.json
    const localPackage = getPackage(dir)
    if (localPackage && localPackage[name]) {
      config = merge({}, localPackage[name])
    }
    // then merge the config if it already exists
    const configDir = path.join(dir, `.${name}.json`)
    if (fs.existsSync(configDir)) {
      config = merge(config, JSON.parse(fs.readFileSync(configDir)))
    }
    // return
    return config
  }

  checkProject () {
    if (typeof this.project.dir !== 'string') {
      this.consoleWarn('you need to go inside a project for this command')
      process.exit()
    }
  }

  checkWeb () {
    if (this.program.web === 'off') {
      this.consoleError('you need to have internet for this')
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
    console.error(string.red)
  }

}

export default Teleport

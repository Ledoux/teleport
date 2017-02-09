// regeneratorRuntime is needed for async await
import 'babel-polyfill'

import { getRandomId } from './utils/functions'
import program from './utils/program'

const mainMethods = [
  'build',
  'check',
  'configure',
  'connect',
  'console',
  'check',
  'create',
  'deploy',
  'dump',
  'exec',
  'get',
  'init',
  'install',
  'map',
  'push',
  'read',
  'replace',
  'run',
  'set',
  'start',
  'version',
  'write'
]
const subModules = mainMethods.map(method => require(`./methods/${method}`))
const collectionNames = ['servers', 'types']

class Teleport {
  constructor (extraProgram) {
    // welcome
    console.log('\n\n** Welcome to teleport node-side ! **\n'.bold)
    // bind methods from sub modules
    subModules.forEach(module =>
      Object.keys(module).forEach(key => {
        this[key] = module[key].bind(this)
      })
    )
    // bind program
    this.program = Object.assign({}, program, extraProgram)
    const app = this.app = {}
    this.setAppEnvironment()
    // check for a python venv
    if (!app.venvDir) {
      const warn = 'You did not defined a virtualenv... This may be not good for the pip install time'
      this.consoleWarn(warn.toUpperCase())
    }
    // level is saying
    // if you are actually working in a project, the app itself,
    // or in somewhere not defined yet
    this.level = null
    const project = this.project = {}
    // determine where we are
    this.currentDir = this.program.dir || process.cwd()
    // if we want to create something, then we return because we are not in a project yet
    if (typeof this.program.create !== 'undefined') {
      // in the case where no project name was given, we need to invent one based on a uniq ID
      if (typeof this.program.name !== 'string') {
        this.consoleWarn('You didn\'t mention any particular name, we are going to give you one')
        this.program.name = `app-${getRandomId()}`
      }
      this.level = 'project'
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
      if (typeof project.config === 'undefined') {
        project.config = {
          typesByName: {
            localhost: {}
          }
        }
      }
      // if there is no deployment platform template, then we should escape if we want
      // to do a build, push, run, deploy
      const types = Object.keys(project.config.typesByName)
      if (Object.keys(types).length === 1 &&
      types[0] === 'localhost' &&
      (program.build || program.push || program.run || program.deploy)) {
        this.consoleError('You want to do a deploy task or sub-tasks, but you did not specified a platform template in this project')
        process.exit(1)
      }
    }
    // exit else
    if (!this.level && typeof this.program.check === 'undefined') {
      this.consoleWarn('You are not in a project folder')
      process.exit()
    }
  }

  launch () {
    // unpack
    const { program } = this
    // we can pass args to the cli, either object, or direct values or nothing
    this.setKwarg()
    // it is maybe a call of a main mainMethods
    const programmedMethod = mainMethods.find(method => program[method])
    if (this[programmedMethod]) {
      // check for mapping ? let's see if there is already a collections of arg defined
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
        const collections = collectionSlugs.join(',')
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
      return this[programmedMethod]()
    }
    // default return
    this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !')
  }

  pass () {}
}

export default Teleport

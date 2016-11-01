import fs from 'fs'
import path from 'path'

export function create () {
  this.getLevelMethod('create')()
  this.consoleInfo('Your teleport create was sucessful !')
}

export function createScope () {
  // unpack
  const { program } = this
  // warn
  if (typeof program.scope !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --scope <your_scope_name> in your command')
    return
  }
  this.consoleInfo(`wait a second... We create your ${program.scope} scope !`)
}

export function createProject () {
  // unpack
  const { project, program } = this
  // warn
  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --project <your_project_name> in your command')
    return
  }
  // check
  project.dir = path.join(this.currentDir, program.project)
  this.consoleInfo(`wait a second... We create your ${program.project} project !`)
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`There is already a ${program.project} here...`)
    process.exit()
  }
  // add
  this.add()
  //
  this.consoleInfo(`Your ${program.project} was successfully created, go inside with \'cd ${program.project}\' !`)
}

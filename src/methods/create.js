import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function create () {
  this.getLevelMethod('create')()
  this.consoleInfo('Your teleport create was sucessful !')
}

export function createProject () {
  // unpack
  const { project, program } = this
  // warn
  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please configure --project <your_project_name> in your command')
    return
  }
  // check if such a project exists already here
  project.dir = path.join(this.currentDir, program.project)
  this.consoleInfo(`wait a second... We create your ${program.project} project !`)
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`There is already a ${program.project} here...`)
    process.exit()
  }
  // mkdir the folder app
  childProcess.execSync(`mkdir -p ${program.project}`)
  // write default package
  this.init()
  // info
  this.consoleInfo(`Your ${program.project} was successfully created, go inside with \'cd ${program.project}\' !`)
}

// CREATE TASK
// this is the first task you can call from teleport to build  project.
// - it decides if the name of the project has been set
// (and if not, it will give you a generated name)
// - it checks that the project name is not already existing on the file system
// - it checks that the project name is not already in the projects.json file
// of your teleport
// - it create your folder that will contain the file system
// - it calls the sub tasks init method

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function create () {
  // unpack
  const { app, project, program: { name } } = this
  // check if such a project already exists here
  project.dir = path.join(this.currentDir, name)
  this.consoleInfo(`wait a second... Creating your ${name} project !`)
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`Oops. There is already a ${name} here... Exiting.`)
    process.exit()
  }
  const projectsByName = app.projectsByName
  const previousProject = projectsByName[name]
  if (previousProject) {
    this.consoleWarn(`Oops. There is already a ${name} here ${previousProject.dir}... Exiting`)
    process.exit()
  }
  projectsByName[name] = {
    dir: project.dir
  }
  this.writeProjectsByName(projectsByName)
  // mkdir the folder app
  childProcess.execSync(`mkdir -p ${name}`)
  // write default package
  this.init()
  // info
  this.consoleInfo(`Your ${name} was successfully created, go inside with \'cd ${name}\' !`)
}

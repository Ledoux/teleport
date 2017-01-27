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
  const { app, project, program } = this
  // check if such a project already exists here
  project.dir = path.join(this.currentDir, program.project)
  this.consoleInfo(`wait a second... Creating your ${program.project} project !`)
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`Oops. There is already a ${program.project} here... Exiting.`)
    process.exit()
  }
  const projectsByName = app.projectsByName
  const previousProject = projectsByName[program.project]
  if (previousProject) {
    this.consoleWarn(`Oops. There is already a ${program.project} here ${previousProject.dir}... Exiting`)
    process.exit()
  }
  projectsByName[program.project] = {
    dir: project.dir
  }
  this.writeProjectsByName(projectsByName)
  // mkdir the folder app
  childProcess.execSync(`mkdir -p ${program.project}`)
  // write default package
  this.init()
  // info
  this.consoleInfo(`Your ${program.project} was successfully created, go inside with \'cd ${program.project}\' !`)
}

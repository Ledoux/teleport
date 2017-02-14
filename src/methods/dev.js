// DEV UTILITY TASK
// dev is called when you want to develop a template into a scaffolded app
// with an automatic dump, configure and replace whan you change files.

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { getRandomId } from '../utils/functions'

export function dev () {
  this.createProjectDev()
  this.symlinkProjectDev()
  this.watchAndStartProjectDev()
}

export function createProjectDev () {
  // unpack
  let { app, program } = this
  const { project } = this
  // init
  if (typeof project.config.development === 'undefined') {
    project.config.development = {
      projectsByTemplateOptions: {}
    }
  }
  const projectsByTemplateOptions = project.config.development.projectsByTemplateOptions
  const templatesWithoutProject = program.templates
  const devsDir = path.join(project.dir, 'devs')
  if (!fs.existsSync(devsDir)) {
    childProcess.execSync('mkdir devs')
  }
  // check that this actual project has been published at least once
  // because we need to create a devProject that downloads it
  // (but after the folder in node_modules is replaced by a symlink)
  try {
    childProcess.execSync('npm info')
  } catch (e) {
    this.consoleError(`You need to have published at least one time the package`)
    process.exit(1)
  }
  // create a dev project with inside the actual project as a template
  let dir, name
  if (typeof projectsByTemplateOptions[templatesWithoutProject] === 'undefined') {
    // info
    this.consoleInfo(`There is no dev project for that templates set ${program.templates}`)
    // create the app tha has all of these templates
    name = `app-${getRandomId()}`
    dir = path.join(devsDir, name)
    const createCommand = `${app.concurrentlyDir} \"cd ${devsDir} && tpt -c --name ${name} --templates ${templatesWithoutProject},${project.package.name}\"`
    this.consoleLog(createCommand)
    childProcess.execSync(createCommand, { stdio: [0, 1, 2] })
    projectsByTemplateOptions[templatesWithoutProject] = {
      dir,
      name
    }
  } else {
    const devProject = projectsByTemplateOptions[templatesWithoutProject]
    name = devProject.name
    dir = path.join(devsDir, name)
    if (!fs.existsSync(dir)) {
      this.consoleInfo(`We did not find the corresponding ${name} dev folder`)
      // create a new app
      name = `app-${getRandomId()}`
      dir = path.join(devsDir, name)
      const createCommand = `${app.concurrentlyDir} \"cd ${devsDir} && tpt -c --name ${name} --templates ${templatesWithoutProject},${project.package.name}\"`
      this.consoleLog(createCommand)
      childProcess.execSync(createCommand, { stdio: [0, 1, 2] })
      projectsByTemplateOptions[templatesWithoutProject] = {
        dir,
        name
      }
    } else {
      this.consoleInfo(`We found your corresponding ${name} dev project`)
      return
    }
  }
  // write
  this.writeConfig(project.dir, project.config)
}

export function symlinkProjectDev() {
  const { project, program  } = this
  const devProject = project.config.development.projectsByTemplateOptions[program.templates]
  const nodeModulesDir = path.join(devProject.dir, 'node_modules')
  const symlinkCommand = `cd ${nodeModulesDir} && rm -rf ${project.package.name} && ln -sf ${project.dir} .`
  this.consoleLog(symlinkCommand)
  childProcess.execSync(symlinkCommand, { stdio: [0, 1, 2] })
}

export function watchAndStartProjectDev() {
  const { app, project, program  } = this
  const devProject = project.config.development.projectsByTemplateOptions[program.templates]
  const devsDir = path.join(project.dir, 'devs')
  const nodemonDir = path.join(app.dir, 'node_modules/.bin/nodemon')
  const watchCommand = `${nodemonDir} --watch ${project.dir} --ignore ${devsDir} --exec \'cd ${devProject.dir} && tpt dump && tpt configure && tpt replace\'`
  const startCommand = `cd ${devProject.dir} && tpt -s`
  const totalCommand = `${app.concurrentlyDir} \"${watchCommand}\" \"${startCommand}\"`
  this.consoleLog(totalCommand)
  childProcess.execSync(totalCommand, { stdio: [0, 1, 2] })
}

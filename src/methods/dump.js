import childProcess from 'child_process'
import fs from 'fs'
import { flatten, reverse, uniq } from 'lodash'
import path from 'path'

import { getRequirements, writeRequirements } from '../utils'

// DUMP SUB TASK
// dump is called at the init sub task time, but you can also call it in an already
// created project if you want to dump again things. Two things are to be understood here.
// - dump looks first at all the boilerplate file systems contained in each
// template of the app. These are reachable in the node_modules dir.
// The app does an rsync of each of them with the actual file system of the project.
// One important point is that dump does not rsync important dirs listed in
// the 'excludedDirs' array global variable. Indeed some of them (essentially
// the config files like package.json) has been already merged during the
// configure time (a previous init sub task). Others that are prefixed by _p_
// are placeholder files that will be actually added at the replace
// time (which is a sub task of install).
// - if you have a frontend bundling template, teleport has at this stage
// created a temp server folder 'frontend-server' in your backend/servers dir.
// Given the setting now on what should the server responsible to render the
// html part of the app, the dump task will actually merge this phantom temp
// server folder into the real one. Teleport finds the real html render server
// by first looking at the first one that has a suffix server name ending by
// 'webrouter', and if not, it will find one with a websocket prefix.
// After having merged the frontend-server folder into the <>-webrouter
// or <>-websocket one, it removes the temp frontend-server folder. 

const excludedDirs = [
  'package.json',
  '.gitignore',
  'README.md',
  configFile,
  '\'_p_*\''
]

export function dump () {
  const { project } = this
  this.consoleInfo(`Let\'s dump the templates in ${project.package.name}`)
  const command = this.getDumpProjectBoilerplateCommand()
  this.consoleLog(command)
  const buffer = childProcess.execSync(command)
  console.log(buffer.toString('utf-8'))
  this.dumpMergeFrontendServer()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully dumped!`)

}

export function getDumpProjectBoilerplateCommand () {
  const { app: { configFile }, project } = this
  return project.config.templateNames
    .map(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      // we exclude package.json and config file because we want to merge them
      // and we exclude also files mentionned in the excludes item of the template
      // config
      const templateConfig = this.getConfig(templateDir)
      const totalExcludedDirs = (templateConfig.excludedDirs || [])
        .concat(excludedDirs)
      const excludeOption = totalExcludedDirs
        .map(exclude => `--exclude=${exclude}`)
        .join(' ')
      return `rsync -rv ${excludeOption} ${templateDir}/ ${project.dir}`
    }).join(' && ')
}

export function dumpMergeFrontendServer () {
  let { backend, frontend, program } = this
  const serversDir = path.join(backend.dir, 'servers')
  const serverDirs = fs.readdirSync(serversDir)
  if (serverDirs.includes('frontend-server')) {
    if (!frontend) {
      this.setFrontendEnvironment()
      frontend = this.frontend
    }
    this.consoleInfo('Let\'s move the frontend server in the appropriate place')
    const frontendServerDir = path.join(serversDir, 'frontend-server')
    // we actually move and merge the frontend server into the specified frontend server
    let command = `rsync -rv ${frontendServerDir}/* ${serversDir}/${frontend.serverName}`
    command += `&& rm -rf ${frontendServerDir}`
    this.consoleLog(command)
    const buffer = childProcess.execSync(command)
    console.log(buffer.toString('utf-8'))
  }
  if (program.create) {
    this.install()
  }
}

export function dumpServerBaseRequirements () {
  const { project, server } = this
  const allRequirements = uniq(flatten(reverse(project.allTemplateNames
    .map(templateName => {
      const fileDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name, 'config')
      return getRequirements(fileDir, 'base')
    }))))
  writeRequirements(server.configDir, allRequirements, 'base')
}

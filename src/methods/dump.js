import childProcess from 'child_process'
import fs from 'fs'
import { flatten, reverse, uniq } from 'lodash'
import path from 'path'

import { getRequirements, writeRequirements } from '../utils'

export function dump () {
  this.getLevelMethod('dump')()
  this.consoleInfo('Your teleport dump was sucessful !')
}

export function dumpProject () {
  const { project } = this
  // boilerplate
  this.dumpProjectBoilerplate()
  this.dumpMergeFrontendServer()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully dumped!`)
}

export function dumpProjectBoilerplate () {
  const { project } = this
  this.consoleInfo(`Let\'s dump the templates in ${project.package.name}`)
  const command = this.getDumpProjectBoilerplateCommand()
  this.consoleLog(command)
  const buffer = childProcess.execSync(command)
  console.log(buffer.toString('utf-8'))
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
        .concat([
          'package.json',
          '.gitignore',
          'README.md',
          configFile,
          '\'_p_*\''
        ])
      const excludeOption = totalExcludedDirs
        .map(exclude => `--exclude=${exclude}`)
        .join(' ')
      return `rsync -rv ${excludeOption} ${templateDir}/ ${project.dir}`
    }).join(' && ')
}

export function dumpMergeFrontendServer () {
  let { backend, frontend } = this
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

import childProcess from 'child_process'
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
  // base requirements
  this.setProjectEnvironment()
  this.program.method = 'dumpServerBaseRequirements'
  this.mapInServers()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully configured!`)
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
  return project.allTemplateNames
    .map(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      // we exclude package.json and config file because we want to merge them
      // and we exclude also files mentionned in the excludes item of the template
      // config
      const templateConfig = this.getConfig(templateDir)
      const totalExcludedDirs = (templateConfig.excludedDirs || [])
        .concat([
          'base_Dockerfile*',
          'base_requirements*',
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

export function dumpServerBaseRequirements () {
  const { project, server } = this
  const allRequirements = uniq(flatten(reverse(project.allTemplateNames
    .map(templateName => {
      const fileDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name, 'config')
      return getRequirements(fileDir, 'base')
    }))))
  writeRequirements(server.configDir, allRequirements, 'base')
}

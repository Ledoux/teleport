import childProcess from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

import { getPackage, toTitleCase } from '../utils'

export function get () {
  const getValue = this.kwarg === '.'
  ? this
  : _.get(this, this.kwarg)
  console.log(stringify(getValue, {space: ' '}))
}

export function getConfig (dir) {
  const { app: { configFile, package: {name} } } = this
  let config
  // check first for some attributes in package.json
  const localPackage = getPackage(dir)
  if (localPackage && localPackage[name]) {
    config = _.merge({}, localPackage[name])
  }
  // then merge the config if it already exists
  const configDir = path.join(dir, configFile)
  if (fs.existsSync(configDir)) {
    config = _.merge(config, JSON.parse(fs.readFileSync(configDir)))
  }
  // return
  return config
}

export function getAppConfig (dir) {
  return JSON.stringify(this.getConfig(this.app.dir), null, 2)
}

export function getLevelMethod (command) {
  const methodName = `${command}${toTitleCase(this.level)}`
  const method = this[methodName]
  if (typeof method === 'undefined') {
    this.consoleError(`Sorry there is no such ${methodName} method`)
    process.exit()
  }
  return method
}

export function getAvailablePorts (docker) {
  const { run } = this
  docker = docker || run.docker
  this.checkWeb()
  const { app } = this
  const activateDir = path.join(app.venv, 'bin/activate')
  const command = `source ${activateDir} && python ${app.pythonDir} ports --filter available --docker ${docker}`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

export function getTemplatesOption () {
  const { project, program } = this
  let templatesOption = ''
  if (typeof program.templates !== 'undefined' && program.templates.trim() !== '') {
    templatesOption = program.templates.split(',').join(' ')
  } else if (project.config && project.config.templateNames) {
    templatesOption = project.config.templateNames.join(' ')
  }
  return templatesOption
}

export function getTemplateNames () {
  let templatesOption = this.getTemplatesOption()
  return templatesOption.split(' ')
    .map(template => template.split('@')[0])
    .filter(templateName => templateName.trim() !== '')
}

export function getDepTemplateNames (templateName, depTemplateNames = []) {
  const { project } = this
  depTemplateNames.push(templateName)
  const templateDir = path.join(project.dir, 'node_modules', templateName)
  let templateConfig = this.getConfig(templateDir)
  // make sure we have the node_module
  if (typeof templateConfig === 'undefined') {
    const command = `yarn add --dev ${templateName}`
    // command = `npm install --save-dev ${templateName}`
    childProcess.execSync(command)
  }
  templateConfig = this.getConfig(templateDir)
  const templatePackage = getPackage(templateDir)
  const dependencies = Object.assign({}, templatePackage.dependencies, templatePackage.devDependencies)
  Object.keys(dependencies)
    .forEach(depTemplateName =>
      this.getDepTemplateNames(depTemplateName, depTemplateNames)
    )
  return depTemplateNames
}

export function getAllTemplateNames () {
  const { project: { config: { templateNames } } } = this
  return _.uniq(_.flatten(templateNames.map(templateName =>
  this.getDepTemplateNames(templateName))))
}

export function getTemplateDependencies () {
  const { project: { config, dir } } = this
  return _.fromPairs(config.templateNames
    .map(template => {
      let [templateName, templateVersion] = template.split('@')
      const templateDir = path.join(dir, 'node_modules', templateName)
      templateVersion = templateVersion || getPackage(templateDir).version
      return [templateName, templateVersion]
    }))
}

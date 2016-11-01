import childProcess from 'child_process'
import fs from 'fs'
import { merge, toPairs, values } from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

import { getGitignore, getPackage } from '../utils'

export function add () {
  this.getLevelMethod('add')()
  this.consoleInfo('Your teleport add was sucessful !')
}

export function addScope () {
  // unpack
  const { program } = this
  // warn
  if (typeof program.scope !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --scope <your_scope_name> in your command')
    return
  }
  this.consoleInfo(`wait a second... We create your ${program.scope} scope !`)
}

export function addUpdatedPackage () {
  const { project, program } = this
  project.package = merge(
    {
      name: program.project,
      version: '0.0.1'
    },
    ...values(project.templatesByName)
      .map(template => getPackage(template.dir)
    ))
}

export function addUpdatedConfig () {
  const { project, program, scope } = this
  project.config = merge(
    {
      scope: {
        dir: scope.dir,
        name: scope.package.name
      }
    },
    scope.config
  )
  delete project.config.isScope
  delete project.config.templatesByName
  const templateNames = program.templates.split(',')
  project.config = merge(
    project.config,
    ...templateNames
      .map(templateName => {
        const templateDir = path.join(scope.templatesDir, templateName)
        const templateConfig = this.getConfig(templateDir)
        if (templateConfig) {
          // set the parent template name in the server in order to
          // make them able to retrieve their file templates from the scope
          // for install time
          values(templateConfig.backend.serversByName).forEach(server => {
            server.templateName = templateName
          })
        }
        return templateConfig
      })
  )
  // update requirements
  project.config.requirements = this.app.config.requirements
}

export function addUpdatedGitignore () {
  const { project } = this
  project.gitignore = merge(
    {
      'secret.json': ''
    },
    ...values(project.templatesByName)
      .map(template => getGitignore(template.dir)
    ))
}

export function addProject () {
  const { program, project } = this
  this.setScopeEnvironment()
  this.addUpdatedPackage()
  this.addUpdatedConfig()
  this.addUpdatedGitignore()
  this.copyTemplates()
  this.write(project)
  this.consoleInfo(`Your ${program.project} was successfully augmented with ${program.templates} !`)
}

export function copyTemplates () {
  const { program } = this
  this.consoleInfo(`Let\'s copy the templates in ${program.project}`)
  const command = this.getCopyTemplatesCommand()
  this.consoleLog(command)
  const buffer = childProcess.execSync(command)
  console.log(buffer.toString('utf-8'))
}

export function getCopyTemplatesCommand () {
  const { app: { configFile }, program, project, scope } = this
  if (typeof program.templates !== 'string') {
    this.consoleWarn('You didn\'t mention any particular templates, please add --templates <template1>,<template2>  in your command')
    return
  }
  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular project, please add --project <your_project_name> in your command')
    return
  }
  return toPairs(project.config.templatesByName).map(pairs => {
    const [templateName, template] = pairs
    const scopeTemplateDir = path.join(scope.templatesDir, templateName)
    // we exclude package.json and config file because we want to merge them
    // and we exclude also files mentionned in the excludes item of the template
    // config
    // add package.json and configFile
    const totalExcludedDirs = (template.excludedDirs || [])
      .concat([
        'package.json',
        '.gitignore',
        configFile,
        '\'_p_*\''
      ])
    const excludeOption = totalExcludedDirs
      .map(exclude => `--exclude=${exclude}`)
      .join(' ')
    return `rsync -rv ${excludeOption} ${scopeTemplateDir}/ ${project.dir}`
  }).join(' && ')
}

export function addScopeConfig () {
  const { scope } = this
  scope.config = {
    'python': '</usr/local/bin/python>',
    'backend': {
      'buildPushDockerHost': '<prod.foo.org>',
      'dockerPort': '<4243>',
      'domainName': '<foo.org>',
      'kubernetesUrl': '<http://infra.foo.ai:8080/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard/>',
      'masterHost': '<infra.foo.org>',
      'registryServer': '<registry.foo.ai:5000>',
      'serversByName': {
        '<flask-webrouter>': {
          'baseDockerVersion': '<0.1>',
          'baseTag': '<flask-wbr>',
          'isMain': true,
          'typesByName': {
            'localhost': {
              'host': '<localhost>',
              'port': '<5000>'
            }
          },
          'maintainer': '<Erwan Ledoux erwan.ledoux@snips.ai>',
          'imageAbbreviation': '<wbr>'
        },
        '<flask-websocketer>': {
          'baseTag': '<flask-wbs>',
          'baseDockerVersion': '<0.1>',
          'typesByName': {
            'localhost': {
              'host': '<localhost>',
              'port': '<5001>'
            }
          },
          'maintainer': '<Erwan Ledoux erwan.ledoux@snips.ai>',
          'imageAbbreviation': '<wbs>'
        }
      }
    },
    'typesByName': {
      'localhost': {},
      'unname': {
        'dockerHost': '<dev.foo.org>',
        'imageAbbreviation': '<unm>'
      },
      'staging': {
        'dockerHost': '<dev.foo.org>',
        'imageAbbreviation': '<stg>',
        'hasDns': true
      },
      'prod': {
        'dockerHost': '<prod.foo.org>',
        'imageAbbreviation': '<prod>',
        'hasDns': true
      }
    }
  }
  fs.writeFileSync(scope.configDir, stringify(scope.config, {space: '\t'}))
}

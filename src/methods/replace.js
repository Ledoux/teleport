// REPLACE SUB TASK
// replace is called at the install task time, but you can also call it in an already
// created project if you want to recopy the placeholder files.
// - replace goes to each server of the project and looks at all the placholder files
// for each template.
// Placeholder files are matched via the <REPLACE>, <REPLACE_FOR_EACH_TYPE>_ prefixes in their file name.
// In these files all the $[] instances are replaced with values from this teleport object.
// You can check more precisely how the formatString function works in the ../utils/functions.js.
// Note also that the replace method will for each <REPLACE_FOR_EACH_TYPE>_<file_name> placeholder file
// create one file per type (localhost, staging and production in the common case).
// Meaning that you will have localhost_<file_name>, staging_<file_name>,
// production_<file_name> created.
// - replace goes to your bundler folder and does the same thing

import fs from 'fs'
import glob from 'glob'
import { flatten } from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'

import { templatePrefixes } from '../utils/constants'
import { formatString, getPackage } from '../utils/functions'

const dockerPlaceholderfiles = [
  'build.sh',
  'controller.yaml',
  'deploy.sh',
  'Dockerfile',
  'push.sh',
  'run.sh',
  'service.yaml',
  'start.sh'
]

const notLocalhostPlaceholderFiles = [
  /.*push.sh$/,
  /.*controller.sh$/,
  /.*build.sh$/,
  /.*controller.yaml$/,
  /.*deploy.sh$/,
  /.*Dockerfile$/,
  /.*push.sh$/,
  /.*Procfile$/,
  /.*run.sh$/,
  /.*service.yaml$/
]

export function replace () {
  const { program, project } = this
  // boilerplate
  program.method = 'replaceServerPlaceholderFiles'
  program.methods = null
  this.mapInTypesAndServers()
  // boilerplate
  this.replaceBundlerPlaceholderFiles()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully replaced!`)
}

export function replaceServerPlaceholderFiles () {
  // unpack
  const { backend, project, program, type, run, server, welcome } = this
  // check
  if (typeof welcome === 'undefined') {
    this.setWelcomeEnvironment()
  }
  // connect if no port was set here
  if (type.name !== 'localhost' && typeof run.port === 'undefined') {
    this.connect()
  }
  // add types
  project.typeNames = Object.keys(project.config.typesByName)
  // prepare the extraConfig
  const extraConfig = Object.assign(
    {
      'SITE_NAME': backend.siteName,
      'TYPE': type.name
    },
    backend.dockerEnv,
    server.dockerEnv
  )
  // specify the port if it is available
  if (server.runsByTypeName[type.name] && server.runsByTypeName[type.name].port) {
    run.port = server.runsByTypeName[type.name].port
  }
  if (run.port) {
    extraConfig.PORT = run.port
  }
  this.dockerExtraConfig = Object.keys(extraConfig)
    .map(key => `ENV ${key} ${extraConfig[key]}`).join('\n')
  this.manageExtraConfig = Object.keys(extraConfig)
    .map(key => `export ${key}=${extraConfig[key]}`).join(' && ')
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = `${this.manageExtraConfig} &&`
  }
  // for each template replace
  welcome.allTemplateNames.forEach(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    // replace at the server scope
    const templateServerDir = path.join(templateDir, 'backend/servers', server.name)
    // let's get for all the possible placeholders prefix the matching files
    // and attach to them the prefix
    const templateCouples = flatten(templatePrefixes.map(templatePrefix =>
      glob.sync(path.join(templateServerDir, `**/${templatePrefix}*`))
        .map(templateFileDir => [templatePrefix, templateFileDir])
    ))
    // for each we can decide how to set the installedFileName
    templateCouples.forEach(templateCouple => {
      // unpack
      const [templatePrefix, templateFileDir] = templateCouple
      const dirChunks = templateFileDir.split('/')
      const templatePathDir = dirChunks.slice(0, -1).join('/')
      let installedFileName = dirChunks.slice(-1)[0]
                                .replace(templatePrefix, '')
      if (type.name === 'localhost') {
        // we know that there are some script and config files dedicated to the deploy step
        // so we don't have actually to write them for the localhost type case
        if (notLocalhostPlaceholderFiles.some(notLocalhostPlaceholderFile => {
          return notLocalhostPlaceholderFile.test(installedFileName)
        })) {
          return
        }
        // no need also to replace and write when actually there is already the
        // locahost placeholder file
        const localhostTemplateDir = `${templatePathDir}/__localhost_${installedFileName}`
        if (fs.existsSync(localhostTemplateDir)) {
          return
        }
      } else if (installedFileName.split('_')[0] === 'localhost') {
        // also we have some specific placeholder files dedicated to localhost
        // so if we are not to the localhost case we have to leave
        return
      }
      // if we are not in the case of a deploy file
      // we can escape
      if (type.name !== 'localhost' && typeof backend.helpersByName.docker === 'undefined' &&
        dockerPlaceholderfiles.includes(installedFileName)) {
        return
      }
      if (templatePrefix === '<REPLACE_FOR_EACH_TYPE>_') {
        installedFileName = `${type.name}_${installedFileName}`
      }
      const installedFolderDir = path.join(project.dir, 'backend', dirChunks.slice(0, -1)
                                  .join('/')
                                  .split('backend')
                                  .slice(-1)[0])
      const installedFileDir = path.join(installedFolderDir, installedFileName)
      if (fs.existsSync(installedFileDir) &&
        // we need to have specified force to true to do the replace
        program.force !== 'true'
      ) {
        return
      }
      // make sure that the folder system to this file already exists
      mkdirp.sync(installedFolderDir)
      const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
      // then write inside
      fs.writeFileSync(installedFileDir, formatString(templateFile, this))
    })
  })
}

export function replaceBundlerPlaceholderFiles () {
  // unpack
  const { project, welcome } = this
  // check
  if (typeof welcome === 'undefined') {
    this.setWelcomeEnvironment()
  }
  // replace
  welcome.allTemplateNames.forEach(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    // replace at the server scope
    const templateBundlerDir = path.join(templateDir, 'bundler')
    if (fs.existsSync(templateBundlerDir)) {
      const templateCouples = flatten(
        templatePrefixes.map(templatePrefix =>
          glob.sync(path.join(templateBundlerDir, `**/${templatePrefix}*`))
              .map(templateFileDir => [templatePrefix, templateFileDir])
        ))
      templateCouples.forEach(templateCouple => {
        // unpack
        const [templatePrefix, templateFileDir] = templateCouple
        const dirChunks = templateFileDir.split('/')
        let installedFileName = dirChunks.slice(-1)[0]
                                         .replace(templatePrefix, '')
        if (templatePrefix === '<REPLACE_FOR_EACH_TYPE>_') {
          installedFileName = `${type.name}_${installedFileName}`
        }
        const installedFolderDir = path.join(project.dir, 'bundler')
        const installedFileDir = path.join(installedFolderDir, installedFileName)
        const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
        mkdirp.sync(installedFolderDir)
        fs.writeFileSync(installedFileDir, formatString(templateFile, this))
      })
    }
  })
}

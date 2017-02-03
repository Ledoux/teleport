// REPLACE SUB TASK
// replace is called at the install task time, but you can also call it in an already
// created project if you want to recopy the placeholder files.
// - replace goes to each server of the project and looks at all the placholder files
// for each template.
// Placeholder files are matched via the _p_ prefix in their file name.
// In these files all the $[] instances are replaced with values from this teleport object.
// You can check more precisely how the formatString function works in the ../utils/functions.js.
// Note also that the replace method will for each _p_<file_name> placeholder file
// create one file per type (localhost, staging and production in the common case).
// Meaning that you will have localhost_<file_name>, staging_<file_name>,
// production_<file_name> created.
// - replace goes to your bundler folder and does the same thing, except
// that it is not going to create one file per type, just only one.

import fs from 'fs'
import glob from 'glob'
import mkdirp from 'mkdirp'
import path from 'path'

import { formatString, getPackage } from '../utils/functions'

const dockerPlaceholderfiles = [
  'build.sh',
  'controller.yaml',
  'Dockerfile',
  'service.yaml'
]

const deployPlaceholderfiles = [
  'build.sh',
  'controller.yaml',
  'deploy.sh',
  'push.sh',
  'run.sh',
  'service.yaml'
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
const templatePrefix = '_p_'

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
  const { backend, project, program, type, run, server } = this
  // connect if no port was set here
  if (type.name !== 'localhost' && typeof run.port === 'undefined') {
    this.connect()
  }
  // add types
  project.typeNames = Object.keys(project.config.typesByName)
  // add templateUrls in the context
  const allTemplateNames = this.getAllTemplateNames()
  const templates = allTemplateNames
    .map(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      return {
        iconUrl: this.getConfig(templateDir).iconUrl,
        gitUrl: getPackage(templateDir).repository.url,
        name: templateName
      }})
  // prepare the extraConfig
  const extraConfig = Object.assign(
    {
      'SITE_NAME': backend.siteName,
      'TEMPLATES': `'${JSON.stringify(templates)}'`,
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
  allTemplateNames.forEach(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    // replace at the server scope
    const templateServerDir = path.join(templateDir, 'backend/servers', server.name)
    const templateFileDirs = glob.sync(path.join(templateServerDir, `**/${templatePrefix}*`))
    templateFileDirs.forEach(templateFileDir => {
      const dirChunks = templateFileDir.split('/')
      let installedFileName = dirChunks.slice(-1)[0]
                                       .replace(templatePrefix, '')
      // we know that there are some script and config files dedicated to the deploy step
      // so we don't have actually to write them for the localhost type case
      if (type.name === 'localhost') {
        if (notLocalhostPlaceholderFiles.some(notLocalhostPlaceholderFile => {
          return notLocalhostPlaceholderFile.test(installedFileName)
        })) {
          return
        }
      } else if (installedFileName.split('_')[0] === 'localhost') {
        // also we have some specific placeholder files dedicated to localhost
        // so if we are not to the localhost case we have to leave
        return
      }
      // if we are not in the case of a docker deploy file
      // we can escape
      if (type.name !== 'localhost' && typeof backend.helpersByName.docker === 'undefined' &&
        dockerPlaceholderfiles.includes(installedFileName)) {
        return
      }
      const installedParams = installedFileName.split('_')
      if (
        installedParams.length === 2 && installedParams[0] !== type.name ||
        // NOTE HERE A QUICK WORKAROUND SOLUTION
        // we hardcode the special case of Procfile where we need to make it pass
        // through the replace, but actually not making it specified
        // with the type prefix
        installedParams.length === 1 && installedFileName !== 'Procfile'
      ) {
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
  const { project } = this
  this.getAllTemplateNames().forEach(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    // replace at the server scope
    const templateBundlerDir = path.join(templateDir, 'bundler')
    if (fs.existsSync(templateBundlerDir)) {
      const templateFileDirs = glob.sync(path.join(templateBundlerDir, `**/${templatePrefix}*`))
      templateFileDirs.forEach(templateFileDir => {
        const dirChunks = templateFileDir.split('/')
        let installedFileName = dirChunks.slice(-1)[0]
                                         .replace(templatePrefix, '')
        const installedFolderDir = path.join(project.dir, 'bundler')
        const installedFileDir = path.join(installedFolderDir, installedFileName)
        const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
        mkdirp.sync(installedFolderDir)
        fs.writeFileSync(installedFileDir, formatString(templateFile, this))
      })
    }
  })
}

import fs from 'fs'
import path from 'path'

import { getPackage } from '../utils'

const backendKeys = [
  'buildPushDockerHost',
  'dockerPort',
  'masterServer',
  'registryServer',
  'smtpHost',
  'siteName'
]

const typeKeys = [
  'dockerHost',
  'imageAbbreviation'
]

const serverKeys = [
  'baseDockerVersion',
  'baseTag',
  'dockerEnv',
  'imageAbbreviation',
  'maintainer',
  'typesByName'
]

const typeKeysInServer = [
  'dockerHost',
  'host',
  'port'
]

export function setAppEnvironment () {
  const app = this.app = {}
  app.dir = path.join(__dirname, '../../')
  app.binDir = path.join(app.dir, 'bin')
  app.nodeModulesDir = path.join(app.dir, 'node_modules')
  app.imagesDir = path.join(app.dir, 'images')
  app.utilsDir = path.join(app.dir, 'utils')
  app.pythonBinDir = path.join(app.binDir, 'index.py')
  app.templatesDir = path.join(app.dir, 'templates')
  app.packageDir = path.join(app.dir, 'package.json')
  app.package = JSON.parse(fs.readFileSync(app.packageDir))
  app.configDir = path.join(app.dir, `.${app.package.name}.json`)
  app.config = this.getConfig(app.dir)
  app.templatesByName = {}
  fs.readdirSync(app.templatesDir)
    .forEach(fileOrFolderName => {
      const appTemplateDir = path.join(app.templatesDir, fileOrFolderName)
      const appTemplateConfig = this.getConfig(appTemplateDir)
      if (appTemplateConfig) {
        appTemplateConfig.dir = appTemplateDir
        if (appTemplateConfig.backend) {
          appTemplateConfig.backendDir = path.join(appTemplateDir, 'backend')
          appTemplateConfig.serversDir = path.join(appTemplateConfig.backendDir, 'servers')
        }
        // each template has in its config json only one item in the templatesByName
        const templateName = Object.keys(appTemplateConfig.templatesByName)[0]
        app.templatesByName[templateName] = appTemplateConfig
      }
    })
  this.ttabDir = path.join(app.nodeModulesDir, 'ttab/bin/ttab')
}

export function setTemplatesEnvironment () {
  const { app, project } = this
  project.templatesByName = {}
  project.templatesByName = project.templateNames
    .forEach(templateName => {
      const appTemplate = app.templatesByName[templateName]
      project.templatesByName[templateName] = appTemplate
    })
}

export function setProjectEnvironment () {
  const project = this.project || {}
  project.packageDir = path.join(project.dir, 'package.json')
  project.package = getPackage(project.dir)
  this.project.config = this.getConfig(project.dir)
  // templates
  this.setTemplatesEnvironment()
  // types
  this.setTypesEnvironment()
  // backend
  if (project.config.backend) {
    this.setBackendEnvironment()
  }
}

export function setTypesEnvironment () {
  const { app, project } = this
  this.typeNames = Object.keys(project.config.typesByName)
  this.typeNames.forEach(typeName => {
    const appType = app.config.typesByName[typeName]
    const projectType = project.config.typesByName[typeName]
    typeKeys.forEach(key => {
      projectType[key] = projectType[key] || appType[key]
    })
    if (typeName !== 'localhost') {
      projectType.dockerServer = `${projectType.dockerHost}:${this.dockerPort}`
      projectType.socket = `-H tcp://${projectType.dockerServer}`
    }
  })
  if (this.program.type) {
    this.projectType = project.config.typesByName[this.program.type]
  }
}

export function setDataEnvironment () {
  const { backend } = this
  const data = backend.data = {}
  data.dir = path.join(backend.dir, 'data')
  data.jsonDir = path.join(data.dir, 'json_data')
  data.rethinkDbDir = path.join(data.dir, 'rethinkdb_data')
}

export function setBackendEnvironment () {
  // backend global env
  const backend = this.backend = {}
  const { app, project } = this
  backend.dir = path.join(project.dir, 'backend')
  backend.serversDir = path.join(backend.dir, 'servers')
  backend.pythonScriptsDir = path.join(backend.dir, 'scripts')
  this.setDataEnvironment()
  backendKeys.forEach(key => {
    backend[key] = app.config.backend[key] || project.config.backend[key]
  })
  backend.buildPushDockerServer = `${backend.buildPushDockerHost}:${backend.dockerPort}`
  backend.buildPushSocket = `-H tcp://${backend.buildPushDockerServer}`
  backend.siteName = backend.siteName || project.package.name
  backend.capitalSiteName = backend.siteName.toUpperCase()
  if (typeof project.config.typesByName === 'undefined') {
    project.config.typesByName = app.config.typesByName
  }
  backend.namedTypeNames = this.typeNames.filter(typeName =>
    project.config.typesByName[typeName].hasDns)
  backend.serverNames = Object.keys(project.config.backend.serversByName)
  this.setServersEnvironment()
}

export function setServersEnvironment () {
  const { app, backend, project } = this
  backend.serverNames.forEach(serverName => {
    const appServer = app.config.backend.serversByName[serverName]
    const projectServer = project.config.backend.serversByName[serverName]
    projectServer.dir = path.join(backend.serversDir, serverName)
    projectServer.appServerDir = path.join(app.templatesDir, 'backend/servers', serverName)
    projectServer.configDir = path.join(projectServer.dir, 'config')
    serverKeys.forEach(key => {
      projectServer[key] = projectServer[key] || appServer[key]
    })
    projectServer.baseImageDir = path.join(app.imagesDir, projectServer.baseTag)
    projectServer.isNoCache = false
    projectServer.baseImage = `${backend.registryServer}/${projectServer.baseTag}:${projectServer.baseDockerVersion}`
    projectServer.tag = `${backend.siteName}-${projectServer.imageAbbreviation}`
    if (typeof projectServer.typesByName === 'undefined') {
      projectServer.typesByName = {}
    }

    // specify by type
    this.typeNames.forEach(typeName => {
      const appType = app.config.typesByName[typeName]
      if (typeof projectServer.typesByName[typeName] === 'undefined') {
        projectServer.typesByName[typeName] = {}
      }
      const projectServerType = projectServer.typesByName[typeName]
      typeKeysInServer.forEach(typeKey => {
        if (typeof projectServerType[typeKey] === 'undefined') {
          projectServerType[typeKey] = projectServerType[typeKey] || appType[typeKey]
        }
      })
      // set the docker image
      if (typeName !== 'localhost') {
        // serverSubDomain
        projectServerType.serverSubDomain = projectServerType.dockerHost.split('.')[0]
        // special case where we give to the host just the name of the dockerHost
        if (typeName === 'unname') {
          projectServerType.host = appType.dockerHost
        }
        projectServerType.tag = typeName === 'prod'
        ? projectServer.tag
        : `${appType.imageAbbreviation}-${projectServer.tag}`
        projectServerType.image = `${backend.registryServer}/${projectServerType.tag}:${projectServer.dockerVersion}`
      }
      // set the url
      projectServerType.url = `http://${projectServerType.host}`
      if (projectServerType.port !== null) {
        projectServerType.url += ':' + projectServerType.port
      }
      // watch the ones that have a dns
      if (backend.namedTypeNames.includes(typeName)) {
        const dnsPrefix = typeName === 'prod'
        ? ''
        : `${typeName}-`
        // subdomain
        let subDomainName = `${dnsPrefix}${backend.siteName}`
        if (!projectServer.isMain) {
          subDomainName = `${subDomainName}-${projectServer.imageAbbreviation}`
        }
        // Note : we have to be careful that
        // the tag length is smaller than 24 characters
        if (subDomainName.length > 24) {
          this.consoleError(`this sub domain name ${subDomainName} is too long, you need to make it shorter than 24 characters`)
          process.exit()
        }
        projectServerType.host = projectServer.host || `${subDomainName}.${backend.domainName}`
        projectServerType.url = `https://${projectServerType.host}`
        const virtualNamePrefix = typeName === 'prod'
        ? ''
        : `${appType.imageAbbreviation.toUpperCase()}-`
        projectServerType.virtualName = `${virtualNamePrefix}${backend.capitalSiteName}_${projectServer.imageAbbreviation.toUpperCase()}_SERVICE_HOST`
      }
    })
  })
  if (this.program.server) {
    this.projectServer = project.config.serversByName[this.program.server]
    if (this.program.type) {
      this.projectServerConfig = this.projectServer.typesByName[this.program.type]
    }
  }
}

export function init (program) {
  // set attributes
  this.program = program
  this.setAppEnvironment()
  // project env
  if (process.cwd() === this.app.dir.replace(/\/$/, '')) {
    return
  }
  this.projectDir = process.cwd()
  this.setProjectEnvironment()
}

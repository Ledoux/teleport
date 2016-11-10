import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { getPackage, toCapitalUnderscoreCase, toDashCase } from '../utils'

export function setAppEnvironment () {
  const { app } = this
  app.dir = path.join(__dirname, '../../')
  app.package = getPackage(app.dir)
  app.configFile = `.${app.package.name.split('.js')[0]}.json`
  app.config = this.getConfig(app.dir)
  app.config.scopesByName.default = {
    dir: path.join(app.dir, 'default')
  }
  app.currentScope = app.config.scopesByName[app.config.currentScopeName]
  app.ttabDir = path.join(app.dir, 'node_modules/ttab/bin/ttab')
  app.pythonDir = path.join(app.dir, 'bin/index.py')
}

export function setScopeEnvironment () {
  const { scope } = this
  console.log('scope.dir', scope.dir)
  this.read(scope)
}

export function setProjectEnvironment () {
  const { app, program, project, scope } = this
  this.read(project)
  // version
  Object.assign(project.config, {
    appVersion: app.package.name,
    scope: {
      name: scope.package.name,
      version: scope.package.version
    }
  })
  // sub entities
  this.setTypeEnvironment()
  this.setBackendEnvironment()
  if (typeof project.config.python === 'undefined') {
    project.config.python = childProcess
      .execSync('which python')
      .toString('utf-8').trim()
  }
  project.config.pip = program.global === 'local'
  ? path.join(project.dir, 'venv/bin/pip')
  : childProcess
    .execSync('which pip')
    .toString('utf-8').trim()
}

export function setTypeEnvironment () {
  const { program, project: { config: { pip, typesByName } } } = this
  if (typeof program.type !== 'string') {
    this.type = null
    return
  }
  const type = this.type = Object.assign({}, typesByName[program.type])
  type.name = program.type
  type.pip = type.name === 'localhost'
  ? pip
  : 'pip'
}

export function setBackendEnvironment () {
  // backend global env
  const { project, type } = this
  if (typeof project.config.backend === 'undefined') {
    this.backend = null
    return
  }
  const backend = this.backend = Object.assign({}, project.config.backend)
  backend.dir = path.join(project.dir, 'backend')
  backend.dockerEnv = backend.dockerEnv || {}
  backend.buildPushDockerServer = `${backend.buildPushDockerHost}:${backend.dockerPort}`
  backend.buildPushSocket = `-H tcp://${backend.buildPushDockerServer}`
  backend.siteName = backend.siteName || project.package.name
  backend.capitalUnderscoreSiteName = toCapitalUnderscoreCase(backend.siteName)
  backend.dashSiteName = toDashCase(backend.siteName)
  backend.serverNames = Object.keys(project.config.backend.serversByName)
  // this.serverUrlsByName = {}
  if (type && type.dockerHost) {
    type.dockerServer = `${type.dockerHost}:${backend.dockerPort}`
    type.socket = `-H tcp://${type.dockerServer}`
  }
  this.setProviderEnvironment()
  this.setServerEnvironment()
}

export function setProviderEnvironment () {
  const { backend, program } = this
  if (typeof program.provider !== 'string') {
    this.provider = null
    return
  }
  const provider = this.provider = Object.assign({}, backend.providersByName[program.provider])
  provider.name = program.provider
  provider.dataDir = path.join(backend.dataDir, `${program.provider}_data`)
  provider.startDir = path.join(provider.dataDir, 'start.sh')
}

export function setServerEnvironment () {
  const { backend, program, scope } = this
  if (typeof program.server !== 'string') {
    this.server = null
    return
  }
  const server = this.server = Object.assign({}, backend.serversByName[program.server])
  server.name = program.server
  server.dir = path.join(backend.dir, 'servers', server.name)
  server.configDir = path.join(server.dir, 'config')
  server.scopeTemplateDir = path.join(scope.dir, 'templates', server.templateName)
  server.scopeBackendDir = path.join(server.scopeTemplateDir, 'backend')
  server.scopeServersDir = path.join(server.scopeBackendDir, 'servers')
  server.scopeServerDir = path.join(server.scopeServersDir, server.name)
  server.dockerEnv = server.dockerEnv || {}
  server.isNoCache = false
  server.baseImage = `${backend.registryServer}/${server.baseTag}:${server.baseDockerVersion}`
  server.tag = `${backend.dashSiteName}-${server.imageAbbreviation}`
  if (typeof server.runsByTypeName === 'undefined') {
    server.runsByTypeName = {}
  }
  this.setRunEnvironment()
}

export function setRunEnvironment () {
  const { backend, server, type } = this
  if (!type) {
    this.run = null
    return
  }
  const run = this.run = Object.assign({}, type, server.runsByTypeName[type.name])
  // here we want to mutate the server.runsByTypeName[type.name] to keep the settings
  // that are done here
  server.runsByTypeName[type.name] = run
  // set the docker image
  if (run.dockerHost) {
    // subDomain
    run.dockerName = run.dockerHost.split('.')[0]
    // init
    if (typeof this.availablePortsByDockerName !== 'undefined') {
      this.availablePortsByDockerName[run.dockerName] = []
    }
    // special case where we give to the host just the name of the dockerHost
    if (!type.hasDns) {
      run.host = type.dockerHost
    }
    run.tag = type.name === 'prod'
    ? server.tag
    : `${type.imageAbbreviation}-${server.tag}`
    run.image = `${backend.registryServer}/${run.tag}:${server.dockerVersion}`
    const virtualNamePrefix = type.name === 'prod'
    ? ''
    : `${type.imageAbbreviation.toUpperCase()}_`
    run.virtualName = `${virtualNamePrefix}${backend.capitalUnderscoreSiteName}_${server.imageAbbreviation.toUpperCase()}_SERVICE_HOST`
  }
  // set the url
  run.url = `http://${run.host}`
  if (run.port !== null) {
    run.url += ':' + run.port
  }
  // watch the ones that have a dns
  if (type.hasDns) {
    const dnsPrefix = type.name === 'prod'
    ? ''
    : `${type.name}-`
    // subdomain
    let subDomainName = `${dnsPrefix}${backend.dashSiteName}`
    if (!server.isMain) {
      subDomainName = `${subDomainName}-${server.imageAbbreviation}`
    }
    // Note : we have to be careful that
    // the tag length is smaller than 24 characters
    if (subDomainName.length > 24) {
      this.consoleError(`this sub domain name ${subDomainName} is too long, you need to make it shorter than 24 characters`)
      process.exit()
    }
    run.host = server.host || `${subDomainName}.${backend.domainName}`
    run.url = `https://${run.host}`
  }
}

export function setAllTypesAndServersEnvironment () {
  if (this.allTypesAndProjets !== true) {
    if (typeof this.program.method === 'undefined') {
      this.program.method = 'pass'
    }
    this.mapInTypesAndServers()
    this.allTypesAndProjets = true
  }
}

export function getActivatedPythonVenvCommand () {
  this.checkProject()
  const { project } = this
  const fileName = 'venv/bin/activate'
  if (!fs.existsSync(path.join(project.dir, fileName))) {
    this.consoleError('You need to define a python venv')
    return
  }
  this.consoleInfo('Let\'s activate the venv')
  return `cd ${project.dir} && source ${fileName}`
}

export function setActivatedPythonVenv () {
  if (typeof this.isPythonVenvActivated === 'undefined' || !this.isPythonVenvActivated
  ) {
    const command = this.getActivatedPythonVenvCommand()
    this.consoleLog(command)
    console.log(childProcess.execSync(command).toString('utf-8'))
    this.isPythonVenvActivated = true
  }
}

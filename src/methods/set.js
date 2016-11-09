import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { getPackage } from '../utils'

export function setAppEnvironment () {
  const { app } = this
  app.dir = path.join(__dirname, '../../')
  app.binDir = path.join(app.dir, 'bin')
  app.nodeModulesDir = path.join(app.dir, 'node_modules')
  app.utilsDir = path.join(app.dir, 'utils')
  app.defaultScopeDir = path.join(app.dir, 'default')
  app.pythonBinDir = path.join(app.binDir, 'index.py')
  app.packageDir = path.join(app.dir, 'package.json')
  app.package = getPackage(app.dir)
  app.configFile = `.${app.package.name.split('.js')[0]}.json`
  app.configDir = path.join(app.dir, app.configFile)
  app.config = this.getConfig(app.dir)
  app.defaultDir = path.join(app.dir, 'default')
  if (app.config.scopesByName.default.dir !== app.defaultDir) {
    app.config.scopesByName.default.dir = app.defaultDir
    this.writeConfig(app.dir, app.config)
  }
  app.currentScope = app.config.scopesByName[app.config.currentScopeName]
  this.ttabDir = path.join(app.nodeModulesDir, 'ttab/bin/ttab')
}

export function setScopeEnvironment () {
  const { app: { configFile }, scope } = this
  this.read(scope)
  scope.packageDir = path.join(scope.dir, 'package.json')
  scope.nodeModulesDir = path.join(scope.dir, 'node_modules')
  scope.templatesDir = path.join(scope.dir, 'templates')
  scope.configDir = path.join(scope.dir, configFile)
}

export function setProjectEnvironment () {
  const { program, project } = this
  project.packageDir = path.join(project.dir, 'package.json')
  project.gitignoreDir = path.join(project.dir, '.gitignore')
  project.secretDir = path.join(project.dir, 'secret.json')
  this.read(project)
  this.setTypeEnvironment()
  this.setBackendEnvironment()
  if (typeof project.config.python === 'undefined') {
    project.config.python = childProcess
      .execSync('which python')
      .toString('utf-8').trim()
  }
  if (program.venv !== 'false') {
    project.config.pip = path.join(project.dir, 'venv/bin/pip')
  } else if (typeof project.config.pip === 'undefined') {
    project.config.pip = childProcess
      .execSync('which pip')
      .toString('utf-8').trim()
  }
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
  const backend = this.backend = project.config.backend
  backend.dir = path.join(project.dir, 'backend')
  backend.dataDir = path.join(backend.dir, 'data')
  backend.serversDir = path.join(backend.dir, 'servers')
  backend.pythonScriptsDir = path.join(backend.dir, 'scripts')
  backend.dockerEnv = backend.dockerEnv || {}
  backend.buildPushDockerServer = `${backend.buildPushDockerHost}:${backend.dockerPort}`
  backend.buildPushSocket = `-H tcp://${backend.buildPushDockerServer}`
  backend.siteName = backend.siteName || project.package.name
  backend.capitalSiteName = backend.siteName.toUpperCase()
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
  server.dir = path.join(backend.serversDir, server.name)
  server.configDir = path.join(server.dir, 'config')
  server.requirementsDir = path.join(server.configDir, 'requirements.txt')
  server.scriptsDir = path.join(server.dir, 'scripts')
  // server.depBases = this.getDepBases(server)
  server.dockerEnv = server.dockerEnv || {}
  server.isNoCache = false
  server.baseImage = `${backend.registryServer}/${server.baseTag}:${server.baseDockerVersion}`
  server.tag = `${backend.siteName}-${server.imageAbbreviation}`
  if (typeof server.runsByTypeName === 'undefined') {
    server.runsByTypeName = {}
  }
  server.scopeTemplateDir = path.join(scope.templatesDir, server.templateName)
  server.scopeBackendDir = path.join(server.scopeTemplateDir, 'backend')
  server.scopeServersDir = path.join(server.scopeBackendDir, 'servers')
  server.scopeServerDir = path.join(server.scopeServersDir, server.name)
  server.scopeConfigDir = path.join(server.scopeServerDir, 'config')
  server.scopeScriptsDir = path.join(server.scopeServerDir, 'scripts')
  /*
  if (type) {
    const run = server.runsByTypeName[type.name]
    if (run) {
      this.serverUrlsByName[`${toCapitalRegularCase(server.name)}_URL`] = run.url
    }
  }*/
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
    run.virtualName = `${virtualNamePrefix}${backend.capitalSiteName}_${server.imageAbbreviation.toUpperCase()}_SERVICE_HOST`
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
    let subDomainName = `${dnsPrefix}${backend.siteName}`
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

export function setActivatedPythonVenv () {
  this.checkProject()
  if (typeof this.isPythonVenvActivated === 'undefined' || !this.isPythonVenvActivated
  ) {
    const { project } = this
    const fileName = 'venv/bin/activate'
    if (!fs.existsSync(path.join(project.dir, fileName))) {
      this.consoleError('You need to define a python venv')
      return
    }
    this.consoleInfo('Let\'s activate the venv')
    const command = `cd ${project.dir} && source ${fileName}`
    this.consoleLog(command)
    console.log(childProcess.execSync(command).toString('utf-8'))
    this.isPythonVenvActivated = true
  }
}

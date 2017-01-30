import childProcess from 'child_process'
import fs from 'fs'
import { merge } from 'lodash'
import path from 'path'

import { getPackage,
  getGitignores,
  getRequirements,
  getSecret,
  toCapitalUnderscoreCase,
  toDashCase
} from '../utils'

export function setAppEnvironment () {
  const { app } = this
  app.dir = path.join(__dirname, '../../')
  app.package = getPackage(app.dir)
  app.configFile = `.${app.package.name.split('.js')[0]}.json`
  app.projectsByName = this.getProjectsByName(app.dir)
  // let's check if there is no deprecated projects... ie
  // project with an object in the teleport config, but actually
  // the corresponding dir does not exist anymore
  let isRewritten = false
  Object.keys(app.projectsByName).forEach(name => {
    if (!fs.existsSync(app.projectsByName[name].dir)) {
      delete app.projectsByName[name]
      isRewritten = true
    }
  })
  if (isRewritten) {
    this.writeProjectsByName()
  }
  app.requirements = getRequirements(app.dir)
  app.concurrentlyDir = path.join(app.dir, 'node_modules/.bin/concurrently')
  app.pythonDir = path.join(app.dir, 'bin/index.py')
  let virtualEnvDir = childProcess.execSync('echo $VIRTUAL_ENV')
                                  .toString('utf-8')
                                  .trim()
  app.venvDir = virtualEnvDir !== ''
  ? virtualEnvDir
  : null
}

export function setProjectEnvironment () {
  const { project } = this
  this.read(project)
  // dirs
  project.nodeModulesDir = path.join(project.dir, 'node_modules')
  if (project.config) {
    // sub entities
    this.setTypeEnvironment()
    this.setBackendEnvironment()
    this.setFrontendEnvironment()
  }
}

export function setTypeEnvironment () {
  const { program, project: { config: { pip, typesByName } } } = this
  if (typeof program.type !== 'string') {
    this.type = null
    return
  }
  if (typesByName) {
    const type = this.type = Object.assign({}, typesByName[program.type])
    type.name = program.type
    type.pip = type.name === 'localhost'
    ? pip
    : 'pip'
  }
}

export function setBackendEnvironment () {
  // backend global env
  const { project } = this
  if (typeof project.config.backend === 'undefined') {
    this.backend = null
    return
  }
  const backendConfig = project.config.backend
  const backend = this.backend = Object.assign({}, backendConfig)
  backend.dir = path.join(project.dir, 'backend')
  backend.dockerEnv = backend.dockerEnv || {}
  if (typeof backend.siteName === 'undefined') {
    backend.siteName = project.package.name
  }
  backend.dashSiteName = toDashCase(backend.siteName)
  backend.capitalUnderscoreSiteName = toCapitalUnderscoreCase(backend.dashSiteName)
  if (project.config.backend.serversByName) {
    backend.serverNames = Object.keys(project.config.backend.serversByName)
  }
  this.setDockerEnvironment()
  this.setKubernetesEnvironment()
  this.setProviderEnvironment()
  this.setServersEnvironment()
  this.setServerEnvironment()
}

export function setDockerEnvironment () {
  const { backend } = this
  if (!backend || typeof this.backend.helpersByName === 'undefined') return
  this.docker = this.backend.helpersByName.docker
  this.setBaseEnvironment()
  this.setCurrentEnvironment()
  this.setRegistryEnvironment()
}

export function setBaseEnvironment () {
  const { docker } = this
  if (!docker || typeof docker.imagesByName === 'undefined') return
  this.base = this.docker.imagesByName.base
}

export function setCurrentEnvironment () {
  const { docker } = this
  if (!docker || typeof docker.imagesByName === 'undefined') return
  this.current = this.docker.imagesByName.current
  this.setMaintainerEnvironment()
}

export function setMaintainerEnvironment () {
  const { current } = this
  if (!current) return
  this.maintainer = this.current.maintainer
}

export function setRegistryEnvironment () {
  const { docker } = this
  if (!docker) return
  this.registry = this.docker.registry
}

export function setKubernetesEnvironment () {
  const { backend } = this
  if (!backend || typeof this.backend.helpersByName === 'undefined') return
  this.kubernetes = this.backend.helpersByName.kubernetes
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

export function setServersEnvironment () {
  const { backend } = this
  this.serversByName = Object.assign({}, backend.serversByName)
}

export function setServerEnvironment () {
  let { backend, docker, program } = this
  if (typeof program.server !== 'string') {
    this.server = null
    return
  }
  if (!backend) {
    this.setBackendEnvironment()
    backend = this.backend
  }
  const configServer = backend.serversByName[program.server]
  const server = this.server = Object.assign({}, configServer)
  server.name = program.server
  server.dir = path.join(backend.dir, 'servers', server.name)
  server.package = getPackage(server.dir)
  server.gitignores = getGitignores(server.dir)
  server.configDir = path.join(server.dir, 'config')
  server.dockerEnv = server.dockerEnv || {}
  server.isNoCache = false
  server.tag = `${backend.dashSiteName}-${server.abbreviation}`
  if (typeof server.runsByTypeName === 'undefined') {
    server.runsByTypeName = {}
  }
  this.setSecretEnvironment()
  this.setRunEnvironment()
  if (server.docker) {
    docker = merge(docker, server.docker)
  }
}

export function setSecretEnvironment () {
  let { server } = this
  if (!server) return
  this.secret = getSecret(server.configDir)
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
  // server.runsByTypeName[type.name] = run
  // set the docker image
  if (run.name !== 'localhost') {
    if (backend.helpersByName.kubernetes) {
      run.nodeName = `${run.subDomain}.${backend.nodeDomain}`
      // special case where we give to the host just the name of the dockerHost
      if (!type.hasDns) {
        run.host = run.nodeName
      }
    }
    run.tag = type.name === 'production'
    ? server.tag
    : `${type.abbreviation}-${server.tag}`
    const virtualNamePrefix = type.name === 'production'
    ? ''
    : `${type.abbreviation.toUpperCase()}_`
    run.virtualName = `${virtualNamePrefix}${backend.capitalUnderscoreSiteName}_${server.abbreviation.toUpperCase()}_SERVICE_HOST`
  } else {
    run.tag = `localhost-${server.tag}`
  }
  // set the url
  run.url = run.host
  ? `http://${run.host}`
  : (run.name === 'localhost' ? 'http://localhost' : `https://${backend.siteName}.${backend.domain}`)
  if (run.port) {
    run.url += ':' + run.port
  }
  // watch the ones that have a dns
  if (type.hasDns) {
    const dnsPrefix = type.name === 'production'
    ? ''
    : `${type.name}-`
    // subdomain
    run.subDomain = `${dnsPrefix}${backend.dashSiteName}`
    if (!server.isMain) {
      run.subDomain = `${run.subDomain}-${server.abbreviation}`
    }
    // Note : we have to be careful that
    // the tag length is smaller than 24 characters
    if (run.subDomain.length > 24) {
      this.consoleError(`this sub domain name ${run.subDomain} is too long, you need to make it shorter than 24 characters`)
      process.exit()
    }
    run.host = server.host || `${run.subDomain}.${backend.domain}`
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

export function setFrontendEnvironment () {
  const { backend, project } = this
  if (typeof project.config.frontend === 'undefined') {
    this.frontend = null
    return
  }
  const frontend = this.frontend = project.config.frontend
  // we need to resolve the frontend server
  if (typeof backend === 'undefined') {
    this.setBackendEnvironment()
  }
  const serverNames = Object.keys(backend.serversByName)
  frontend.serverName = frontend.serverName ||
    serverNames.find(serverName => /\w+-webrouter/.test(serverName)) ||
    serverNames.find(serverName => /\w+-websocket/.test(serverName))

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
    childProcess.execSync(command, { stdio: [0, 1, 2] })
    this.isPythonVenvActivated = true
  }
}

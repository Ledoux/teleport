const childProcess = require('child_process')

const {toTitleCase} = require('../utils')

export function getUsedPorts () {
  this.checkWeb()
  const command = `python ${this.appPythonBinDir} ports --server ${this.projectServerType.serverSubDomain}`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

export function checkPort () {
  if (typeof this.usedPorts === 'undefined') {
    this.usedPorts = this.getUsedPorts()
  }
  // const server = this.projectConfig.serversByName[this.program.server]
}

export function getAvailablePorts () {
  this.checkWeb()
  const command = `python ${this.appPythonBinDir} ports --filter available --server ${this.projectServerType.serverSubDomain}`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

export function getBuildDockerCommand (config) {
  this.checkProject()
  const { backend, project, program } = this
  if (typeof config === 'undefined') { config = {} }
  config = Object.assign(
    {
      isBase: false,
      server: 'webrouter'
    },
    config
  )
  const serverName = typeof this.program.server === 'undefined'
    ? config.server
    : program.server
  const dir = config.isBase
    ? this.webrouterBaseImageDir
    : backend.dir
  const type = program.type === 'localhost'
  ? 'staging'
  : this.program.type
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${type}${toTitleCase(serverName)}Image`]
  const cache = program.cache === 'false'
    ? '--no-cache'
    : (config.isNoCache ? '--no-cache' : '')
  const file = config.isBase
          ? ''
          : `-f ${type}_${serverName}_Dockerfile`
  var socket = this.buildPushSocket
  return [
    `cd ${dir}`,
    `docker ${socket} build ${file} -t ${imageName} ${cache} .`,
    `cd ${project.dir}`
  ].join(' && ')
}

export function buildDocker () {
  this.checkWeb()
  this.checkPort()
  const command = this.getBuildDockerCommand()
  console.log(
    `Ok we build your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getPushDockerCommand (config) {
  this.checkProject()
  if (typeof config === 'undefined') { config = {} }
  config = Object.assign({
    isBase: false,
    server: 'webrouter'
  }, config)
  const serverName = typeof this.program.server === 'undefined'
                  ? config.server
                  : this.program.server
  const dir = config.isBase
            ? this[`${config.server}BaseImageDir`]
            : this.backendDir
  const type = this.program.type === 'localhost'
  ? 'staging'
  : this.program.type
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${type}${toTitleCase(serverName)}Image`]
  const socket = this.buildPushSocket
  return [
    `cd ${dir}`,
    `docker ${socket} push ${imageName}`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

export function pushDocker () {
  this.checkWeb()
  this.checkPort()
  const command = this.getPushDockerCommand()
  console.log(
    `Ok we push your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getRegisterDockerCommand (config) {
  this.checkProject()
  if (typeof config === 'undefined') { config = {} }
  config = Object.assign({
    server: 'webrouter'
  }, config)
  const serverName = typeof this.program.server === 'undefined'
                  ? config.server
                  : this.program.server
  const type = this.program.type === 'localhost'
  ? 'staging'
  : this.program.type
  const serviceYamlPath = `${this.backendConfigDir}/${type}_${serverName}_service.yaml`
  const controllerYamlPath = `${this.backendConfigDir}/${type}_${serverName}_controller.yaml`
  return [
    `python ${this.appPythonBinDir} service register ${serviceYamlPath}`,
    `python ${this.appPythonBinDir} service register ${controllerYamlPath}`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

export function registerDocker () {
  this.checkWeb()
  this.checkPort()
  const command = this.getRegisterDockerCommand()
  console.log(
    `Ok we register your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getRestartDockerCommand (config) {
  this.checkProject()
  if (typeof config === 'undefined') { config = {} }
  config = Object.assign({
    isBase: false,
    server: 'webrouter'
  }, config)
  const serverName = typeof this.program.server === 'undefined'
                  ? config.server
                  : this.program.server
  const titleWebserverName = toTitleCase(serverName)
  const dir = this.backendDir
  const type = this.program.type === 'localhost'
  ? 'staging'
  : this.program.type
  let tag = this[`${type}${titleWebserverName}Tag`]
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${type}${titleWebserverName}Image`]
  var url = this[`${type}${titleWebserverName}Url`]
  if (type === 'unname') {
    tag = '--name ' + tag
    var portNumber = this[`${type}${titleWebserverName}Port`]
    var port = `-p ${portNumber}:${portNumber}`
    var socket = this[`${type}Socket`]
    var command = `docker ${socket} run -d ${port} ${tag} ${imageName}`
  } else {
    command = `python ${this.appPythonBinDir} service restart ${tag}`
  }
  return [
    `cd ${dir}`,
    command,
    `echo Your service is available here : ${url}`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

export function restartDocker () {
  this.checkWeb()
  this.checkPort()
  const command = this.getRestartDockerCommand()
  console.log(
    `Ok we restart your docker container... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
  console.log(`If you have some trouble, go to ${this.appConfig.kubernetesUrl}`)
}

export function deploy () {
  this.buildDocker()
  this.pushDocker()
  this.registerDocker()
  this.restartDocker()
}

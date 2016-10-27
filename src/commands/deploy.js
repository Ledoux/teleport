const childProcess = require('child_process')

const {toTitleCase} = require('../utils')

module.exports.getAvailablePorts = function () {
  const command = `python ${this.appPythonBinDir} service ports`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

module.exports.getBuildDockerCommand = function (config) {
  this.checkProject()
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
    : this.program.server
  const dir = config.isBase
    ? this.webrouteBaseImageDir
    : this.backendDir
  const hostName = this.program.host === 'localhost'
  ? 'staging'
  : this.program.host
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${hostName}${toTitleCase(serverName)}Image`]
  const cache = this.program.cache === 'false'
    ? '--no-cache'
    : (config.isNoCache ? '--no-cache' : '')
  const file = config.isBase
          ? ''
          : `-f ${hostName}_${serverName}_Dockerfile`
  var socket = this.buildPushSocket
  return [
    `cd ${dir}`,
    `docker ${socket} build ${file} -t ${imageName} ${cache} .`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

module.exports.buildDocker = function () {
  const command = this.getBuildDockerCommand()
  console.log(
    `Ok we build your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getPushDockerCommand = function (config) {
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
  const hostName = this.program.host === 'localhost'
  ? 'staging'
  : this.program.host
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${hostName}${toTitleCase(serverName)}Image`]
  const socket = this.buildPushSocket
  return [
    `cd ${dir}`,
    `docker ${socket} push ${imageName}`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

module.exports.pushDocker = function () {
  const command = this.getPushDockerCommand()
  console.log(
    `Ok we push your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getRegisterDockerCommand = function (config) {
  this.checkProject()
  if (typeof config === 'undefined') { config = {} }
  config = Object.assign({
    server: 'webrouter'
  }, config)
  const serverName = typeof this.program.server === 'undefined'
                  ? config.server
                  : this.program.server
  const hostName = this.program.host === 'localhost'
  ? 'staging'
  : this.program.host
  const serviceYamlPath = `${this.backendConfigDir}/${hostName}_${serverName}_service.yaml`
  const controllerYamlPath = `${this.backendConfigDir}/${hostName}_${serverName}_controller.yaml`
  return [
    `python ${this.appPythonBinDir} service register ${serviceYamlPath}`,
    `python ${this.appPythonBinDir} service register ${controllerYamlPath}`,
    `cd ${this.projectDir}`
  ].join(' && ')
}

module.exports.registerDocker = function () {
  const command = this.getRegisterDockerCommand()
  console.log(
    `Ok we register your docker image... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getRestartDockerCommand = function (config) {
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
  const hostName = this.program.host === 'localhost'
  ? 'staging'
  : this.program.host
  let tag = this[`${hostName}${titleWebserverName}Tag`]
  const imageName = config.isBase
            ? this[`${serverName}BaseImage`]
            : this[`${hostName}${titleWebserverName}Image`]
  var url = this[`${hostName}${titleWebserverName}Url`]
  if (hostName === 'unname') {
    tag = '--name ' + tag
    var portNumber = this[`${hostName}${titleWebserverName}Port`]
    var port = `-p ${portNumber}:${portNumber}`
    var socket = this[`${hostName}Socket`]
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

module.exports.restartDocker = function () {
  const command = this.getRestartDockerCommand()
  console.log(
    `Ok we restart your docker container... can take a little of time ...
    ${command}`
  )
  console.log(childProcess.execSync(command).toString('utf-8'))
  console.log(`If you have some trouble, go to ${this.appConfig.kubernetesUrl}`)
}

module.exports.deploy = function () {
  this.buildDocker()
  this.pushDocker()
  this.registerDocker()
  this.restartDocker()
}

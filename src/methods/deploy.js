import childProcess from 'child_process'

export function deploy () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  if (program.server && program.type) {
    this.deployServer()
  } else {
    this.deployServers()
  }
}

export function deployBaseServers () {
  const { program } = this
  program.method = 'deployServer'
  program.methods = null
  this.setTypeEnvironment()
  this.mapInServers()
}

export function deployServerInNewTab () {
  const { app, program, server, type } = this
  const command = `${app.ttabDir} tpt -d --server ${server.name} --type ${type.name} --cache ${program.cache}`
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function deployServers () {
  const { program } = this
  program.method = 'deployServer'
  if (program.user === 'me') {
    program.method = `${program.method}InNewTab`
  }
  program.methods = null
  this.setTypeEnvironment()
  this.mapInServers()
}

export function deployServer () {
  const { program } = this
  this.buildDocker()
  this.pushDocker()
  if (program.image !== 'base') {
    this.registerDocker()
    this.restartDocker()
  }
}

export function getUsedPorts () {
  this.checkWeb()
  const { app, run } = this
  if (!run) return
  const command = `python ${app.pythonDir} ports --docker ${run.host}`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

export function checkPort () {
  if (typeof this.usedPorts === 'undefined') {
    this.usedPorts = this.getUsedPorts()
  }
}

export function getBuildDockerCommand (config) {
  this.checkProject()
  const { backend, project, program, run, server, type } = this
  let fileName = 'Dockerfile'
  if (program.image) {
    fileName = `${program.image}_${fileName}`
  }
  if (type) {
    fileName = `${type.name}_${fileName}`
  }
  const imageName = program.image
  ? server[`${program.image}Image`]
  : run.image
  const cache = program.cache === 'true'
    ? ''
    : '--no-cache'
  return [
    `cd ${server.dir}`,
    `docker ${backend.buildPushSocket} build -f ${fileName} -t ${imageName} ${cache} .`,
    `cd ${project.dir}`
  ].join(' && ')
}

export function buildDocker () {
  this.checkWeb()
  this.checkPort()
  const { program, server, type } = this
  const command = this.getBuildDockerCommand()
  this.consoleInfo(`Ok we build your docker image of ${type.name} ${program.image ? program.image : ''} ${server.name}...
    can take a little of time...`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getPushDockerCommand (config) {
  this.checkProject()
  const { backend, project, program, run, server } = this
  let imageName
  if (program.image) {
    imageName = server[`${program.image}Image`]
  } else if (run) {
    imageName = run.image
  }
  const command = [
    `cd ${server.dir}`,
    `docker ${backend.buildPushSocket} push ${imageName}`,
    `cd ${project.dir}`
  ].join(' && ')
  return command
}

export function pushDocker () {
  this.checkWeb()
  // this.checkPort()
  const command = this.getPushDockerCommand()
  this.consoleInfo(`Ok we push your docker image...
    can take a little of time...`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getRegisterDockerCommand (config) {
  this.checkProject()
  const { app, project, run, server, type } = this
  if (!run) return
  const serviceYamlPath = `${server.configDir}/${type.name}_service.yaml`
  const controllerYamlPath = `${server.configDir}/${type.name}_controller.yaml`
  return [
    `python ${app.pythonDir} register ${serviceYamlPath}`,
    `python ${app.pythonDir} register ${controllerYamlPath}`,
    `cd ${project.dir}`
  ].join(' && ')
}

export function registerDocker () {
  this.checkWeb()
  this.checkPort()
  const command = this.getRegisterDockerCommand()
  this.consoleInfo(`Ok we register your docker image...
    can take a little of time...`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getRestartDockerCommand (config) {
  this.checkProject()
  const { app, project, server, type, run } = this
  let command
  if (type.name === 'unname') {
    const tag = '--name ' + run.tag
    const port = `-p ${run.port}:${run.port}`
    command = `docker ${type.socket} run -d ${port} ${tag} ${run.image}`
  } else {
    command = `python ${app.pythonDir} restart ${run.tag}`
  }
  return [
    `cd ${server.dir}`,
    command,
    `echo Your service is available here : ${run.url}`,
    `cd ${project.dir}`
  ].join(' && ')
}

export function restartDocker () {
  const { project } = this
  this.checkWeb()
  this.checkPort()
  const command = this.getRestartDockerCommand()
  this.consoleInfo(`Ok we restart your docker container...
    can take a little of time...`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  this.consoleInfo(`If you have some trouble, go to ${project.config.backend.kubernetesUrl}`)
}

export function getDnsDockerCommand () {
  const { run } = this
  return `sky dns add ${run.dockerHost} ${run.dns} snips.ai`
}

import childProcess from 'child_process'

export function deploy () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let command = `tpt -e --script deploy --type ${program.type} --servers all`
  if (program.user === 'me') {
    command = `${command} --ttab true`
  }
  childProcess.execSync(command)
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

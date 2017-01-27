// INSTALL SUB TASK
// install is called at the create task time, but you can also call it in an already
// created project if you want to reinstall things:
// - installScript method looks if there are no such global bin/install.sh script to be executed
// - installKubernetes checks if your kubernetes config is okay for a potential deploy via this platform
// - teleport have some python scripts therefore installAppRequirements makes sure that they
// are installed in the bound venv
// - installSecrets install empty json config file put in the server config folders
// - replace is an important sub task that you need to see specifically in the replace.js script
// - finally installServers parse all the servers to do their own specific install process by executing
// their scripts/install.sh file

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function install () {
  const { backend, app, program, project } = this
  // we may need to temp all the child process commands
  // in an array in order to call them at once with
  // a concurrently command
  if (program.shell === 'concurrently') {
    this.concurrentlyInstallCommands = []
  }
  // check for backend install
  this.consoleInfo(`Let\'s install this project !`)
  if (backend) {
    this.installScript()
    this.installKubernetes()
    this.installAppRequirements()
    this.installSecrets()
    this.write(this.project)
    this.replace()
    this.installServers()
  }
  // now
  if (program.shell === 'concurrently') {
    const concurrentlyInstallCommandsString = this.concurrentlyInstallCommands
      .map(concurrentlyCommand => `\"${concurrentlyCommand}\"`)
      .join(' ')
    const command = `${app.concurrentlyDir} ${concurrentlyInstallCommandsString}`
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
  this.consoleInfo(`install was successful !`)
}

export function installScript () {
  const { app, program } = this
  // check if exists
  if (!fs.existsSync(path.join(this.project.dir, 'bin/install.sh'))) return
  let command = `cd ${this.project.dir} && sh bin/install.sh`
  // if the shell is concurrently, we don't want actually to execute
  // the code directly but put it in the temp commands array
  if (program.shell !== 'concurrently') {
    this.consoleInfo('Let\'s install the project')
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else {
    this.concurrentlyInstallCommands.push(command)
  }
}

export function installKubernetes () {
  const { project } = this
  if (!project.config.backend || !project.config.backend.kubernetes) {
    return
  }
  this.consoleInfo('Let\'s install kubernetes configs')
  const command = this.getInstallKubernetesCommand()
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
  this.consoleInfo('kubernetes configs are installed !')
}

export function getInstallKubernetesCommand () {
  this.checkProject()
  const { kubernetes, project: { dir } } = this
  if (typeof kubernetes === 'undefined') {
    this.consoleError('You must define a kubernetes config')
    process.exit(1)
  }
  let commands = [`cd ${path.join(dir, 'bin')}`]
  commands.push(`kubectl config set-cluster master --server=http://${kubernetes.host}:${kubernetes.port}`)
  commands.push('kubectl config set-context master --cluster=master')
  commands.push('kubectl config use-context master')
  commands.push('kubectl get nodes')
  return commands.join(' && ')
}

export function installDocker () {
  const { docker } = this
  const dockerVersionDigit = parseInt(childProcess
    .execSync('docker version --format \'{{.Client.Version}}\'')
    .toString('utf-8')
    .replace(/(\.+)/g, ''))
  const projectDockerVersion = docker.version
  const projectDockerVersionDigit = parseInt(projectDockerVersion
    .replace(/(\.+)/g, ''))
  if (dockerVersionDigit > projectDockerVersionDigit) {
    const dockerFile = `docker-${project.dockerVersion}`
    const command = [
      `exec wget https://get.docker.com/builds/Darwin/x86_64/${projectDockerVersion}`,
      `cp ${dockerFile} $(which docker)`,
      `rm ${dockerFile}`
    ].join(' && ')
    this.consoleInfo(`Let\'s install a good docker version, that one : ${projectDockerVersion}`)
    this.consoleLog(command)
    childProcess.execSync(command)
  }
}

export function installAppRequirements () {
  const { app, program } = this
  this.consoleInfo('Let \'s install in the venv the tpt requirements')
  let command = `pip install ${app.requirements.join(' ')}`
  // if the shell is concurrently, we don't want actually to execute
  // the code directly but put it in the temp commands array
  if (program.shell !== 'concurrently') {
    this.consoleInfo('Let\'s install the project')
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else {
    this.concurrentlyInstallCommands.push(command)
  }
}

export function installServers () {
  const { program } = this
  program.image = undefined
  program.method = 'installServer'
  program.methods = null
  program.type = 'localhost'
  this.setTypeEnvironment()
  this.mapInServers()
}

export function installServer () {
  const { app, program, server } = this
  const commands = []
  let fileName = 'install.sh'
  fileName = `localhost_${fileName}`
  let fileDir = path.join(server.dir, 'scripts', fileName)
  if (!fs.existsSync(fileDir)) {
    fileName = 'install.sh'
  }
  this.consoleInfo(`Let\'s launch the ${fileName} needed in the server... it can\'t take a long time`)
  // for now for settings like Xcode8 with ElCaptain uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  commands.push(`cd ${server.dir}`)
  commands.push(`${program.permission} sh scripts/${fileName}`)
  let command = commands.join(' && ')
  // if the shell is concurrently, we don't want actually to execute
  // the code directly but put it in the temp commands array
  if (program.shell !== 'concurrently') {
    this.consoleInfo('Let\'s install the project')
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else {
    this.concurrentlyInstallCommands.push(command)
  }
}

export function installSecrets () {
  const { program } = this
  program.base = null
  program.method = 'installSecret'
  program.methods = null
  this.mapInServers()
}

export function installSecret () {
  const { server } = this
  // configure maybe an empty secret
  const secretDir = path.join(server.dir, 'config/secret.json')
  if (!fs.existsSync(secretDir)) {
    fs.writeFileSync(secretDir, '{}')
  }
}

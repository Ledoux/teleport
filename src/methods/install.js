import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function install () {
  this.getLevelMethod('install')()
  this.consoleInfo(`install was successful !`)
}

export function installProject () {
  const { backend, project: { package: { name } } } = this
  this.consoleInfo(`Let\'s install this ${name} project !`)
  if (backend) {
    this.installBackend()
  }
  this.consoleInfo('project install done !')
}

export function installBackend () {
  this.installScript()
  this.installKubernetes()
  this.installAppRequirements()
  this.installSecrets()
  this.write(this.project)
  this.replace()
  this.installServers()
}

export function installScript () {
  const { app, program } = this
  let command = `cd ${this.project.dir} && sh bin/install.sh`
  if (program.user === 'me') {
    command = `${app.ttabDir} "${command}"`
  }
  this.consoleInfo('Let\'s install the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installKubernetes () {
  const { project } = this
  if (!project.config.backend || !project.config.backend.kubernetes) {
    return
  }
  this.consoleInfo('Let\'s install kubernetes configs')
  const command = this.getInstallKubernetesCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  this.consoleInfo('kubernetes configs are installed !')
}

export function getInstallKubernetesCommand () {
  this.checkProject()
  const { kubernetes, project: { dir } } = this
  if (typeof kubernetes === 'undefined') {
    this.consoleError('You must define a kubernetes config')
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
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  if (program.user === 'me') {
    command = `${app.ttabDir} "${command}"`
  }
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
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
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  if (program.user === 'me') {
    command = `${app.ttabDir} "${command}"`
  }
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
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

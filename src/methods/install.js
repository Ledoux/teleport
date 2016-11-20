import childProcess from 'child_process'
import fs from 'fs'
import { values } from 'lodash'
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
  this.installPythonVenv()
  this.installAppRequirements()
  this.installSecrets()
  this.installPorts()
  this.write(this.project)
  this.replace()
  this.installServers()
}

export function installScript () {
  const command = `cd ${this.project.dir} && sh bin/install.sh`
  this.consoleInfo('Let\'s install the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installKubernetes () {
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

export function getInstallVenvCommand () {
  this.checkProject()
  const { project, program } = this
  let option = ''
  if (program.lib === 'global') {
    option = '--system-site-packages'
  }
  const venvDir = path.join(project.dir, project.config.venv, '../')
  return `cd ${venvDir} && virtualenv -p ${project.config.python} venv ${option}`
}

export function installPythonVenv () {
  const { project, program } = this
  if (program.lib === 'global') {
    return
  }
  // check if a path to a venv was already set
  if (project.config.venv && fs.existsSync(project.config.venv)) {
    this.consoleInfo(`There is already a venv here ${project.config.venv}`)
    return
  }
  // just maybe check if there is one venv on the parent dir
  const parentVenvDir = path.join(project.dir, '../venv')
  if (fs.existsSync(parentVenvDir)) {
    this.consoleInfo(`There is a venv here on the parent folder`)
    project.config.venv = '../venv'
    return
  }
  // either create one at the level of the project
  project.config.venv = './venv'
  this.consoleInfo('...Installing a python venv for our backend')
  const command = this.getInstallVenvCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installAppRequirements () {
  const { app, project } = this
  this.consoleInfo('Let \'s install in the venv the tpt requirements')
  const command = `source ${project.config.venv}/bin/activate && pip install ${app.requirements.join(' ')}`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installServer () {
  const { app, program, server } = this
  const commands = []
  let fileName = 'install.sh'
  if (program.image && typeof program.image !== 'undefined') {
    fileName = `${program.image}_${fileName}`
  }
  fileName = `localhost_${fileName}`
  this.consoleInfo(`Let\'s launch the ${fileName} needed in the docker server... it can\'t take a long time`)
  // for now for settings like Xcode8 with ElCaptai uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  commands.push(`cd ${server.dir}`)
  commands.push(`${program.permission} sh scripts/${fileName}`)
  let command = commands.join(' && ')
  if (program.user === 'me') {
    command = `${app.ttabDir} "${command}"`
  }
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installPorts () {
  this.checkProject()
  this.checkWeb()
  const { project: { config, dir } } = this
  this.availablePortsBySubDomain = {}
  values(config.typesByName)
  .forEach(type => {
    if (type.subDomain) {
      this.availablePortsBySubDomain[type.subDomain] = this.getAvailablePorts(type.subDomain)
    }
  })
  if (config.backend && config.backend.serversByName) {
    Object.keys(config.backend.serversByName)
      .forEach((serverName, index) => {
        const server = config.backend.serversByName[serverName]
        Object.keys(config.typesByName).forEach(typeName => {
          let run = server.runsByTypeName[typeName]
          if (typeof run === 'undefined') {
            run = server.runsByTypeName[typeName] = {}
          }
          const subDomain = run.subDomain || config.typesByName[typeName].subDomain
          if (typeof subDomain === 'undefined') {
            return
          }
          if (this.availablePortsBySubDomain[subDomain]) {
            const availablePorts = this.availablePortsBySubDomain[subDomain]
            if (availablePorts.length < 1) {
              this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.')
              process.exit()
            }
            run.port = availablePorts[0].toString()
            this.availablePortsBySubDomain[subDomain] = availablePorts.slice(1)
          }
        })
      })
  }
  this.writeConfig(dir, config)
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

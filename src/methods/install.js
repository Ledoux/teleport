import childProcess from 'child_process'
import fs from 'fs'
import { values } from 'lodash'
import path from 'path'

import { formatString, toTitleCase } from '../utils'

const notLocalhostPlaceholderFiles = [
  'controller.yaml',
  'Dockerfile',
  'service.yaml'
]

export function install () {
  this.getLevelMethod('install')()
  this.consoleInfo(`install was successful !`)
}

export function installScope () {
  const { scope: { package: { name } } } = this
  this.consoleInfo(`Let\'s install this ${name} scope !`)
  // this.installDocker()
  this.installKubernetes()
  this.installInApp()
  this.consoleInfo('scope install done !')
}

export function installDocker () {
  const { scope } = this
  const dockerVersionDigit = parseInt(childProcess
    .execSync('docker version --format \'{{.Client.Version}}\'')
    .toString('utf-8')
    .replace(/(\.+)/g, ''))
  const scopeDockerVersionDigit = parseInt(scope.dockerVersion
    .replace(/(\.+)/g, ''))
  if (dockerVersionDigit > scopeDockerVersionDigit) {
    const dockerFile = `docker-${scope.dockerVersion}`
    const command = [
      `exec wget https://get.docker.com/builds/Darwin/x86_64/${scope.dockerVersion}`,
      `cp ${dockerFile} $(which docker)`,
      `rm ${dockerFile}`
    ].join(' && ')
    this.consoleInfo(`Let\'s install a good docker version, that one : ${scope.dockerVersion}`)
    this.consoleLog(command)
    childProcess.execSync(command)
  }
}

export function getInstallKubernetesCommand () {
  const { app, scope } = this
  let commands = [`cd ${app.binDir}`]
  commands.push(`kubectl config set-cluster master --server=http://${scope.config.backend.masterHost}:8080`)
  commands.push('kubectl config set-context master --cluster=master')
  commands.push('kubectl config use-context master')
  commands.push('kubectl get nodes')
  return commands.join(' && ')
}

export function installKubernetes () {
  this.checkScope()
  this.consoleInfo('Let\'s install kubernetes configs')
  const command = this.getInstallKubernetesCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  console.log('kubernetes configs are installed !')
}

export function installInApp () {
  this.checkScope()
  const { app, scope } = this
  // register maybe
  app.config.scopesByName[scope.package.name] = {
    dir: scope.dir
  }
  // set current
  app.config.currentScopeName = scope.package.name
  // write
  const writtenConfig = Object.assign({}, app.config)
  delete writtenConfig.scopesByName.default
  this.writeConfig(app.dir, writtenConfig)
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
  this.installPythonVenv()
  this.installAppPythonLib()
  this.installBasePlaceholderFiles()
  this.installBaseServers()
  this.installPorts()
  this.setAllTypesAndServersEnvironment()
  this.installPlaceholderFiles()
  this.installServers()
  this.installSecrets()
  this.write(this.project)
}

export function getInstallVenvCommand () {
  this.checkProject()
  const { project, program } = this
  let option = ''
  if (program.lib === 'global') {
    option = '--system-site-packages'
  }
  return `cd ${project.dir} && virtualenv -p ${project.config.python} venv ${option}`
}

export function installPythonVenv () {
  const { program, project } = this
  if (typeof project.config.python === 'undefined' || program.lib === 'global') {
    return
  }
  this.consoleInfo('... Installing a python venv for our backend')
  const command = this.getInstallVenvCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installAppPythonLib () {
  const { program, project } = this
  if (program.lib === 'local') {
    this.setActivatedPythonVenv()
  }
  this.consoleInfo('... Installing the python lib necessary for the teleport app')
  const command = `cd ${project.dir} && ${project.config.pip} install -r requirements.txt`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installBasePlaceholderFiles () {
  const { program } = this
  program.image = 'base'
  program.method = null
  program.methods = [
    {
      folder: 'scripts',
      file: 'install.sh'
    },
    {
      folder: 'server',
      file: 'Dockerfile'
    }
  ].map(newProgram => () => {
    Object.assign(program, newProgram)
    this.installPlaceholderFile()
  })
  this.mapInTypesAndServers()
}

export function installBaseServers () {
  const { program } = this
  program.image = 'base'
  program.method = 'installServer'
  program.methods = null
  program.type = 'localhost'
  this.setTypeEnvironment()
  this.mapInServers()
}

export function installServer () {
  const { program, server } = this
  if (program.lib === 'local') {
    this.setActivatedPythonVenv()
  }
  let fileName = 'install.sh'
  if (program.image && typeof program.image !== 'undefined') {
    fileName = `${program.image}_${fileName}`
  }
  fileName = `localhost_${fileName}`
  this.consoleInfo(`Let\'s launch the ${fileName} needed in the docker server... it can\'t take a long time`)
  // for now for settings like Xcode8 with ElCaptai uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  const installCommand = `cd ${server.dir} && ${program.permission} sh scripts/${fileName}`
  this.consoleLog(installCommand)
  console.log(childProcess.execSync(installCommand).toString('utf-8'))
}

export function installPorts () {
  this.checkProject()
  this.checkWeb()
  this.availablePortsByDockerName = {}
  this.setAllTypesAndServersEnvironment()
  Object.keys(this.availablePortsByDockerName)
        .forEach(dockerName => {
          this.availablePortsByDockerName[dockerName] = this.getAvailablePorts(dockerName)
        })
  const { backend } = this
  Object.keys(backend.serversByName)
    .forEach((serverName, index) => {
      const server = backend.serversByName[serverName]
      values(server.runsByTypeName).forEach(run => {
        if (this.availablePortsByDockerName[run.dockerName]) {
          const availablePorts = this.availablePortsByDockerName[run.dockerName]
          if (availablePorts.length < 1) {
            this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.')
            process.exit()
          }
          run.port = availablePorts[0].toString()
          this.availablePortsByDockerName[run.dockerName] = availablePorts.slice(1)
        }
      })
    })
}

export function installPlaceholderFiles () {
  const { program } = this
  this.setAllTypesAndServersEnvironment()
  program.image = undefined
  program.method = null
  program.methods = [
    'service.yaml',
    'controller.yaml',
    'client_secret.json',
    'uwsgi.ini',
    'guwsgi.ini'
  ].map(file => {
    return {
      folder: 'config',
      file: file
    }
  }).concat([
    'install.sh',
    'start.sh'
  ].map(file => {
    return {
      folder: 'scripts',
      file: file
    }
  })).concat([
    'Dockerfile'
  ].map(file => {
    return {
      folder: 'server',
      file: file
    }
  })).map(newProgram => () => {
    Object.assign(program, newProgram)
    this.installPlaceholderFile()
  })
  this.mapInTypesAndServers()
}

const templatePrefix = '_p_'

export function installPlaceholderFile () {
  this.checkProject()
  const { backend, program, run, server, type } = this
  // check
  if (!backend || !run || !server || !type ||
    (type.name === 'localhost' && notLocalhostPlaceholderFiles.includes(program.file))
  ) { return }
  // set the file name
  let installedFileName = program.file
  let typePrefix
  if (program.image && typeof program.image !== 'undefined') {
    installedFileName = `${program.image}_${installedFileName}`
  }
  if (type) {
    typePrefix = `${type.name}_`
    installedFileName = `${typePrefix}${installedFileName}`
  }
  // look first if there is no specific <type>_<image>_<script> template
  let templateFile
  let templateFileName = installedFileName
  const templateFolderDirKey = `scope${toTitleCase(program.folder)}Dir`
  const templateFolderDir = server[templateFolderDirKey]
  templateFileName = `${templatePrefix}${templateFileName}`
  let templateFileDir = path.join(templateFolderDir, templateFileName)
  if (fs.existsSync(templateFileDir)) {
    templateFile = fs.readFileSync(templateFileDir, 'utf-8')
  } else {
    // remove the type prefix then to find a general <image>_<script> template
    templateFileName = templateFileName.slice(templatePrefix.length + typePrefix.length)
    templateFileName = `${templatePrefix}${templateFileName}`
    templateFileDir = path.join(templateFolderDir, templateFileName)
    if (fs.existsSync(templateFileDir)) {
      templateFile = fs.readFileSync(templateFileDir, 'utf-8')
    } else {
      return
    }
  }
  const installedFolderDirKey = program.folder === 'server'
  ? 'dir'
  : `${program.folder}Dir`
  const installedFolderDir = server[installedFolderDirKey]
  const installedFileDir = path.join(installedFolderDir, installedFileName)
  // prepare the dockerExtraConfig
  const extraConfig = Object.assign(
    {
      'DOCKER_HOST': run.host,
      'SITE_NAME': backend.siteName,
      'TYPE': type.name,
      'URL': run.url,
      'WEB': 'on'
    },
    backend.dockerEnv,
    server.dockerEnv
  )
  this.dockerExtraConfig = Object.keys(extraConfig)
    .map(key => `ENV ${key} ${extraConfig[key]}`).join('\n')
  this.manageExtraConfig = Object.keys(extraConfig)
    .map(key => `export ${key}=${extraConfig[key]}`).join(' && ')
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = `${this.manageExtraConfig} &&`
  }
  // info
  this.consoleInfo(`Let\'s install this placeholder file ${installedFileDir}`)
  // replace
  fs.writeFileSync(installedFileDir, formatString(templateFile, this))
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

export function installSecrets () {
  const { program } = this
  program.base = null
  program.method = 'installSecret'
  program.methods = null
  this.mapInServers()
}

export function installSecret () {
  const { server } = this
  // add maybe an empty secret
  const secretDir = path.join(server.configDir, 'secret.json')
  if (!fs.existsSync(secretDir)) {
    fs.writeFileSync(secretDir, '{}')
  }
}

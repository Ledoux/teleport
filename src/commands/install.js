import childProcess from 'child_process'
import fs from 'fs'
import { toPairs } from 'lodash'
import path from 'path'

import { formatString } from '../utils'

export function installPackage () {
  const { project, program } = this
  // like available ports
  if (program.web !== 'off') {
    // get the whole available
    const availablePorts = this.getAvailablePorts()
    this.serverNames.forEach((serverName, index) => {
      const server = project.config.serversByName[serverName]
      toPairs(server.typesByName).forEach(pairs => {
        const { typeName, type } = pairs
        program.server = serverName
        program.type = typeName
        type.port = availablePorts[0]
        // delete this one in the availables
        delete availablePorts[0]
      })
    })
  }
  // set maybe the python command
  if (fs.existsSync(this.webrouterRequirementsDir) || fs.existsSync(this.websocketerRequirementsDir)) {
    if (typeof project.config.python === 'undefined') {
      project.config.python = childProcess
        .execSync('which python')
        .toString('utf-8').trim()
    }
  }
}

export function installBackend () {
  const { backend, program, project } = this
  // create a constants.json if not
  if (fs.existsSync(backend.configDir)) {
    if (!fs.existsSync(backend.constantsDir)) {
      fs.writeFileSync(backend.constantsDir, '{}')
    }
  }
  // maybe create a venv python
  if (program.venv !== 'false') {
    if (fs.existsSync(this.webrouterRequirementsDir) || fs.existsSync(this.websocketerRequirementsDir)) {
      this.createVenv()
    }
  }
  // deploy
  this.installDockerFiles()
  this.installServiceFiles()
  this.installControllerFiles()
  this.installClientSecretFiles()
  this.installUwsgiFiles()
  if (program.venv !== 'false' && project.config.python) {
    this.installPythonLib()
  }
}

export function getInstallPythonLibCommand () {
  const { app, program, project } = this
  const sudo = program.permission
  const commands = [`cd ${project.dir} && source venv/bin/activate`]
  this.webrouterBaseRequirementsDir = path.join(
    this.appImagesDir, project.config.webrouterBaseTag, 'config/requirements_webrouter.txt')
  if (fs.existsSync(this.webrouterBaseRequirementsDir)) {
    commands.push(`cd ${project.dir} && pip install -r ${this.webrouterBaseRequirementsDir}`)
  }
  this.websocketerBaseRequirementsDir = path.join(
    app.imagesDir, project.config.websocketerBaseTag, 'config/requirements_websocketer.txt')
  if (fs.existsSync(this.websocketerBaseRequirementsDir)) {
    commands.push(`cd ${project.dir} && pip install -r ${this.websocketerBaseRequirementsDir}`)
  }
  // for some reason, some python lib requires sudo install even if we are in venv mode
  commands.push(`cd ${project.dir} && ${sudo} pip install -r ${this.webrouterRequirementsDir}`)
  commands.push(`cd ${project.dir} && pip install -r ${this.websocketerRequirementsDir}`)
  return commands.join(' && ')
}

export function installPythonLib () {
  const command = this.getInstallPythonLibCommand()
  this.consoleInfo(`...Installing the python deps in your venv, it can take a little of time, and if you meet permission errors, do it in sudo, with the \'--permission sudo\' option, like \'tpt -c --permission sudo\'`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installDockerFiles () {
  this.typeNames.filter(typeName => typeName !== 'localhost')
    .forEach(typeName => {
      const type = this.projectConfig.typesByName[typeName]
      this.serverNames.forEach(serverName => {
        const projectServersByName = this.projectConfig.serversByName
        const server = projectServersByName[serverName]
        const typeInServer = server.typesByName[typeName]
        const fileName = 'Dockerfile'
        const templateFileDir = path.join(server.appServerDir, fileName)
        const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
        const installedFileDir = `${server.dir}/${typeName}_${fileName}`
        // add some variables
        const serverUrlsByName = {}
        this.serverNames.forEach(serverName =>
          serverUrlsByName[`${serverName.toUpperCase()}_URL`] = projectServersByName[serverName][`${typeName}Url`]
        )
        const dockerEnv = Object.assign(serverUrlsByName, server.dockerEnv)
        const extraConfig = Object.keys(dockerEnv).map(key =>
          `${key} ${dockerEnv[key]}`).join('\n')
        const format = Object.assign({ extraConfig }, typeInServer, type, server)
        // replace
        fs.writeFileSync(installedFileDir,
          formatString(templateFile, format))
      })
    })
}

export function installServiceFiles () {
  this.namedTypeNames.forEach(namedTypeName => {
    const type = this.projectConfig.typesByName[namedTypeName]
    this.serverNames.forEach(serverName => {
      const server = this.projectConfig.serversByName[serverName]
      const typeInServer = server.typesByName[namedTypeName]
      const fileName = `${namedTypeName}_service.yaml`
      const fileDir = `${server.configDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir,
        formatString(file, Object.assign({}, typeInServer, type)))
    })
  })
  return this
}

export function installControllerFiles () {
  this.namedTypeNames.forEach(namedTypeName => {
    const type = this.projectConfig.typesByName[namedTypeName]
    this.serverNames.forEach(serverName => {
      const server = this.projectConfig.serversByName[serverName]
      const typeInServer = server.typesByName[namedTypeName]
      const fileName = `${namedTypeName}_controller.yaml`
      const fileDir = `${server.configDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir, formatString(file,
        Object.assign({}, typeInServer, type)))
    })
  })
  return this
}

export function installUwsgiFiles () {
  this.typeNames.forEach(typeName => {
    const type = this.projectConfig.typesByName[typeName]
    this.serverNames.forEach(serverName => {
      const uwsgiName = serverName === 'webrouter' ? 'uwsgi' : 'guwsgi'
      const server = this.projectConfig.serversByName[serverName]
      const typeInServer = server.typesByName[typeName]
      const fileName = `${typeName}_${uwsgiName}.ini`
      const fileDir = `${server.configDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir, formatString(file,
        Object.assign({}, typeInServer, type)))
    })
  })
  return this
}

export function installClientSecretFiles () {
  this.typeNames.forEach(typeName => {
    const type = this.projectConfig.typesByName[typeName]
    this.serverNames.forEach(serverName => {
      const server = this.projectConfig.serversByName[serverName]
      const typeInServer = server.typesByName[typeName]
      const fileName = `${typeName}_client_secret.json`
      const fileDir = `${server.configDir}/${fileName}`
      if (!fs.existsSync(fileDir)) {
        return
      }
      const file = fs.readFileSync(fileDir, 'utf-8')
      const format = Object.assign({}, typeInServer, type)
      fs.writeFileSync(fileDir, formatString(file, format))
    })
  })
  return this
}

export function install () {
  const { project } = this
  this.installPackage()
  if (project.backend) {
    this.installBackend()
  }
}

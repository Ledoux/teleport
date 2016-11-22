import fs from 'fs'
import path from 'path'

import { formatString } from '../utils'

const notLocalhostPlaceholderFiles = [
  'build.sh',
  'controller.yaml',
  'deploy.sh',
  'Dockerfile',
  'push.sh',
  'run.sh',
  'service.yaml'
]
const templatePrefix = '_p_'

export function replace () {
  this.getLevelMethod('replace')()
  this.consoleInfo('Your teleport replace was sucessful !')
}

export function replaceProject () {
  const { project } = this
  // boilerplate
  this.setAllTypesAndServersEnvironment()
  this.replacePlaceholderFiles()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully replaced!`)
}

export function replacePlaceholderFiles () {
  const { program } = this
  this.setAllTypesAndServersEnvironment()
  program.image = undefined
  program.method = null
  program.methods = [
    'service.yaml',
    'controller.yaml',
    'client_secret.json',
    'guwsgi.ini',
    'uwsgi.ini',
    'guwsgi.ini'
  ].map(file => {
    return {
      folder: 'config',
      file: file
    }
  }).concat([
    'build.sh',
    'deploy.sh',
    'install.sh',
    'push.sh',
    'run.sh',
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
    this.replacePlaceholderFile()
  })
  this.mapInTypesAndServers()
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

export function replacePlaceholderFile () {
  this.checkProject()
  const { backend, program, project, run, server, type } = this
  // connect if no port was set here
  if (type.name !== 'localhost' && typeof run.port === 'undefined') {
    this.connect()
  }
  // check
  if (!backend || !run || !server || !type ||
    (type.name === 'localhost' && notLocalhostPlaceholderFiles.includes(program.file))
  ) { return }
  // set the file name
  let installedFileName = program.file
  if (type) {
    installedFileName = `${type.name}_${installedFileName}`
  }
  // look first if there is no specific <type>_<script> in a certain template
  let templateFileDir = null
  // get all templates
  const allTemplateNames = this.getAllTemplateNames()
  const foundTemplateName = allTemplateNames.find(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    const templateServerDir = path.join(templateDir, 'backend/servers', server.name)
    const templateFolderDir = program.folder === 'server'
    ? templateServerDir
    : path.join(templateServerDir, program.folder)
    let templateFileName = installedFileName
    templateFileName = `${templatePrefix}${templateFileName}`
    templateFileDir = path.join(templateFolderDir, templateFileName)
    if (fs.existsSync(templateFileDir)) return true
    // remove the type prefix then to find a general <script> template
    templateFileName = `${templatePrefix}${program.file}`
    templateFileDir = path.join(templateFolderDir, templateFileName)
    return fs.existsSync(templateFileDir)
  })
  if (!templateFileDir || typeof foundTemplateName === 'undefined') return
  const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
  const installedFolderDir = program.folder === 'server'
  ? server.dir
  : path.join(server.dir, program.folder)
  const installedFileDir = path.join(installedFolderDir, installedFileName)
  // ok for now if the file already exists and that we are not in the force mode, leave
  if (fs.existsSync(installedFileDir) && program.force !== 'true') {
    return
  }
  // prepare the dockerExtraConfig
  const extraConfig = Object.assign(
    {
      'DOCKER_HOST': run.host,
      'PORT': run.port,
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

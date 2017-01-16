import fs from 'fs'
import glob from 'glob'
import path from 'path'

import { formatString } from '../utils'

const dockerPlaceholderfiles = [
  'build.sh',
  'controller.yaml',
  'deploy.sh',
  'Dockerfile',
  'push.sh',
  'run.sh',
  'service.yaml'
]

const notLocalhostPlaceholderFiles = [
  /.*push.sh$/,
  /.*controller.sh$/,
  /.*build.sh$/,
  /.*controller.yaml$/,
  /.*deploy.sh$/,
  /.*Dockerfile$/,
  /.*push.sh$/,
  /.*Procfile$/,
  /.*run.sh$/,
  /.*service.yaml$/
]
const templatePrefix = '_p_'

export function replace () {
  this.replaceProject()
  this.consoleInfo('Your teleport replace was sucessful !')
}

export function replaceProject () {
  const { program, project } = this
  // boilerplate
  program.method = 'replacePlaceholderFiles'
  program.methods = null
  this.mapInTypesAndServers()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully replaced!`)
}

export function replacePlaceholderFiles () {
  // unpack
  const { backend, project, program, type, run, server } = this
  // connect if no port was set here
  if (type.name !== 'localhost' && typeof run.port === 'undefined') {
    this.connect()
  }
  // prepare the dockerExtraConfig
  const extraConfig = Object.assign(
    {
      'SITE_NAME': backend.siteName,
      'TYPE': type.name,
      'WEB': 'on'
    },
    backend.dockerEnv,
    server.dockerEnv
  )
  // specify the port if it is already set
  if (run.port) {
    extraConfig.PORT = run.port
  }
  this.dockerExtraConfig = Object.keys(extraConfig)
    .map(key => `ENV ${key} ${extraConfig[key]}`).join('\n')
  this.manageExtraConfig = Object.keys(extraConfig)
    .map(key => `export ${key}=${extraConfig[key]}`).join(' && ')
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = `${this.manageExtraConfig} &&`
  }
  // for each template replace
  this.getAllTemplateNames().forEach(templateName => {
    const templateDir = path.join(project.nodeModulesDir, templateName)
    const templateServerDir = path.join(templateDir, 'backend/servers', server.name)
    const templateFileDirs = glob.sync(path.join(templateServerDir, `**/${templatePrefix}*`))
    templateFileDirs.forEach(templateFileDir => {
      const dirChunks = templateFileDir.split('/')
      let installedFileName = dirChunks.slice(-1)[0]
                                       .replace(templatePrefix, '')
      // we know that there are some script and config files dedicated to the deploy step
      // so we don't have actually to write them for the localhost type case
      if (type.name === 'localhost') {
        if (notLocalhostPlaceholderFiles.find(notLocalhostPlaceholderFile => {
          return notLocalhostPlaceholderFile.test(installedFileName)
        })) {
          return
        }
      } else if (installedFileName.split('_')[0] === 'localhost') {
        // also we have some specific placeholder files dedicated to localhost
        // so if we are not to the localhost case we have to leave
        return
      }
      // if we are not in the case of a docker deploy file
      // we can escape
      if (typeof backend.helpersByName.docker === 'undefined' &&
        dockerPlaceholderfiles.includes(installedFileName)) {
        return
      }
      const installedParams = installedFileName.split('_')
      if (
        installedParams.length === 2 && installedParams[0] !== type.name ||
        // NOTE HERE A QUICK WORKAROUND SOLUTION
        // we hardcode the special case of Procfile where we need to make it pass
        // through the replace, but actually not making it specified
        // with the type prefix
        installedParams.length === 1 && installedFileName !== 'Procfile'
      ) {
        installedFileName = `${type.name}_${installedFileName}`
      }
      const installedFileDir = path.join('backend', dirChunks.slice(0, -1)
                                  .join('/')
                                  .split('backend')
                                  .slice(-1)[0], installedFileName)
      if (fs.existsSync(installedFileDir) && program.force !== 'true') {
        return
      }
      const templateFile = fs.readFileSync(templateFileDir, 'utf-8')
      fs.writeFileSync(installedFileDir, formatString(templateFile, this))
    })
  })
}

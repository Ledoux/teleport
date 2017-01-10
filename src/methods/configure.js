import childProcess from 'child_process'
import fs from 'fs'
import { flatten, merge, uniq } from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'

import { getGitignores,
  getPackage,
  writePackage
} from '../utils'

export function configure () {
  const { project } = this
  // script
  if (fs.existsSync(path.join(this.project.dir, 'bin/configure.sh'))) {
    this.configureScript()
  }
  // project
  this.configureProject()
  // servers
  // this.program.method = 'configureServer'
  // this.mapInServers()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully configured!`)
}

export function configureScript () {
  const command = `cd ${this.project.dir} && sh bin/configure.sh`
  this.consoleInfo('Let\'s configure the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function configureProject () {
  const { project } = this
  this.configureProjectConfig()
  this.configureProjectPackage()
  this.configureProjectGitignore()
  this.write(project)
}

export function configureProjectConfig () {
  // unpack
  const { project } = this
  // init again the config
  project.config.templateNames = this.getTemplateNames()

  // merge
  project.config = merge(
    project.config,
    ...project.config.templateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName)
        let templateConfig = this.getConfig(templateDir)
        // remove attributes that are specific to the project
        delete templateConfig.templateNames
        if (templateConfig.backend) {
          delete templateConfig.backend.siteName
        }
        return templateConfig
      })
    )
}

export function configureProjectPackage () {
  const { project } = this
  const templateDependencies = this.getTemplateDependencies()
  if (Object.keys(templateDependencies).length > 0) {
    project.package = merge(project.package, {
      devDependencies: templateDependencies
    })

    // merge
    project.package = merge(
      project.package,
      ...Object.keys(templateDependencies)
        .map(templateName => {
          const templateDir = path.join(project.nodeModulesDir, templateName)
          let templatePackage = getPackage(templateDir)
          let { dependencies, devDependencies } = templatePackage
          return { dependencies, devDependencies }
        })
      )
  }
}

export function configureProjectGitignore () {
  const { project } = this
  project.gitignores = getGitignores(project.dir)
  project.config.templateNames
    .forEach(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      const gitignores = getGitignores(templateDir)
      project.gitignores = project.gitignores.concat(gitignores)
    })
  project.gitignores = uniq(project.gitignores)
}

export function configureServer () {
  const { server } = this
  // this.configureServerConfig()
  this.configureServerPackage()
  // this.configureServerGitignore()
  // this.write(server)
  mkdirp.sync(server.dir)
  writePackage(server.dir, server.package)
  // writeGitignore(server.dir, server.gitignores)
}

export function configureServerConfig () {
  // unpack
  const { project, server } = this

  // merge
  server.config = merge(
    server.config || {},
    ...project.config.templateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name)
        let templateConfig = this.getConfig(templateDir)
        return templateConfig
      })
    )
}

export function configureServerPackage () {
  // unpack
  const { project, server } = this

  // merge
  server.package = merge(
    server.package || {},
    ...project.config.templateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name)
        let templatePackage = getPackage(templateDir)
        return templatePackage
      })
    )
}

export function configureServerGitignore () {
  // unpack
  const { project, server } = this

  // merge
  server.gitignores = uniq(flatten(
    (server.gitignores || []).concat(
    project.config.templateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name)
        let templateGitignores = getGitignores(templateDir)
        return templateGitignores
      })
    )))
}

// CONFIGURE SUB TASK
// configure is called at the init sub task time
// - configureScript checks if there is no such global sh script bin/configure.sh
// to execute
// - configureProject merges all the config files (package.json, .teleport.json and gitignore)
// found also in the templates and located at the first level of the project folder.
// Note thaty for the package case, merge is only done for these items: babel, dependencies, devDependencies, peerDependencies
// - configureServer does the same kind of task but in each server folder level.

import childProcess from 'child_process'
import fs from 'fs'
import { flatten, merge, uniq } from 'lodash'
import mkdirp from 'mkdirp'
import path from 'path'

import { getGitignores,
  getPackage,
  writeGitignore,
  writePackage
} from '../utils/functions'

export function configure () {
  const { project } = this
  // script
  if (fs.existsSync(path.join(this.project.dir, 'bin/configure.sh'))) {
    this.configureScript()
  }
  // project
  this.configureProject()
  // servers
  this.program.method = 'configureServer'
  this.mapInServers()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully configured!`)
}

export function configureScript () {
  const command = `cd ${this.project.dir} && sh bin/configure.sh`
  this.consoleInfo('Let\'s configure the project')
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
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

  // add a default localhost type if there was not a platfomr template
  // that did taht already
  if (typeof project.config.typesByName === 'undefined') {
    project.config.typesByName = {
      localhost: {}
    }
  }
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
          let { babel, dependencies, devDependencies, peerDependencies } = templatePackage
          return { babel, dependencies, devDependencies, peerDependencies }
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
  this.configureServerPackage()
  mkdirp.sync(server.dir)
  writePackage(server.dir, server.package)
  this.configureServerGitignore()
  writeGitignore(server.dir, server.gitignores)
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
  // prefix
  server.package.name = `${project.package.name}-${server.package.name}`
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

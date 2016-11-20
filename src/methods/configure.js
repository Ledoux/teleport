import childProcess from 'child_process'
import { merge, uniq, values } from 'lodash'
import path from 'path'

import { getGitignores } from '../utils'

export function configure () {
  this.getLevelMethod('configure')()
  this.consoleInfo('Your teleport configure was sucessful !')
}

export function configureProject () {
  const { project } = this
  // script
  this.configureScript()
  // write
  this.configureProjectConfig()
  this.configureProjectPackage()
  this.configureProjectGitignore()
  this.write(project)
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully configured!`)
}

export function configureScript () {
  const command = `cd ${this.project.dir} && sh bin/configure.sh`
  this.consoleInfo('Let\'s configure the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
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
        delete templateConfig.venv
        if (templateConfig.backend) {
          delete templateConfig.backend.siteName
        }
        /*
        // special backend
        if (templateConfig.backend) {
          // set the parent template name in the server in order to
          // make them able to retrieve their file templates from the scope
          // for install time
          values(templateConfig.backend.serversByName)
            .forEach(server => {
              server.templateName = templateName
            })
        }
        */
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
  }
}

export function configureProjectGitignore () {
  const { project } = this
  project.gitignores = [
    '*pyc',
    '*secret.json',
    'node_modules',
    'src',
    'venv'
  ]
  project.config.templateNames
    .forEach(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      const gitignores = getGitignores(templateDir)
      project.gitignores = project.gitignores.concat(gitignores)
    })
  project.gitignores = uniq(project.gitignores)
}

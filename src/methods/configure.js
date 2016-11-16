import childProcess from 'child_process'
import { flatten, merge, reverse, uniq, values } from 'lodash'
import path from 'path'

import { getGitignores, getRequirements, writeRequirements } from '../utils'

export function configure () {
  this.getLevelMethod('configure')()
  this.consoleInfo('Your teleport configure was sucessful !')
}

export function configureProject () {
  const { project } = this
  // write
  this.configureScript()
  this.configureProjectConfig()
  this.configureProjectPackage()
  this.configureProjectGitignore()
  this.write(project)
  // boilerplate
  this.configureProjectBoilerplate()
  // base requirements
  this.setProjectEnvironment()
  this.program.method = 'configureServerBaseRequirements'
  this.mapInServers()
  // info
  this.consoleInfo(`Your ${project.package.name} project was successfully configured!`)
}

export function configureScript () {
  const command = `cd ${this.project.dir} && npm run configure`
  this.consoleInfo('Let\'s configure the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function configureProjectConfig () {
  // unpack
  const { project } = this
  // init again the config
  project.config.templateNames = project.config.templateNames || this.getTemplateNames()
  project.allTemplateNames = this.getAllTemplateNames()

  // merge
  project.config = merge(
    project.config,
    ...project.allTemplateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName)
        let templateConfig = this.getConfig(templateDir)
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
  project.gitignore = merge(
    {
      'secret.json': '',
      'venv': ''
    },
    project.allTemplateNames
      .map(templateName => {
        const templateDir = path.join(project.nodeModulesDir, templateName)
        return getGitignores(templateDir)
      }
    )
  )
}

export function configureServerBaseRequirements () {
  const { project, server } = this
  const allRequirements = uniq(flatten(reverse(project.allTemplateNames
    .map(templateName => {
      const fileDir = path.join(project.nodeModulesDir, templateName, 'backend/servers', server.name, 'config')
      return getRequirements(fileDir, 'base')
    }))))
  writeRequirements(server.configDir, allRequirements, 'base')
}

export function configureProjectBoilerplate () {
  const { project } = this
  this.consoleInfo(`Let\'s copy the templates in ${project.package.name}`)
  const command = this.getConfigureProjectBoilerplateCommand()
  this.consoleLog(command)
  const buffer = childProcess.execSync(command)
  console.log(buffer.toString('utf-8'))
}

export function getConfigureProjectBoilerplateCommand () {
  const { app: { configFile }, project } = this
  return project.allTemplateNames
    .map(templateName => {
      const templateDir = path.join(project.nodeModulesDir, templateName)
      // we exclude package.json and config file because we want to merge them
      // and we exclude also files mentionned in the excludes item of the template
      // config
      const templateConfig = this.getConfig(templateDir)
      const totalExcludedDirs = (templateConfig.excludedDirs || [])
        .concat([
          'base_Dockerfile*',
          'base_requirements*',
          'package.json',
          '.gitignore',
          'README.md',
          configFile,
          '\'_p_*\''
        ])
      const excludeOption = totalExcludedDirs
        .map(exclude => `--exclude=${exclude}`)
        .join(' ')
      return `rsync -rv ${excludeOption} ${templateDir}/ ${project.dir}`
    }).join(' && ')
}

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { writeGitignore, writePackage, writeRequirements } from '../utils'

export function init () {
  const { program, project } = this
  // name
  const name = program.project || project.dir.split('/').slice(-1)[0]
  // mkdir
  const binDir = path.join(project.dir, 'bin')
  childProcess.execSync(`mkdir -p ${binDir}`)
  // package
  project.package = Object.assign({
    name,
    scripts: {
      'configure': 'sh bin/configure.sh'
    },
    version: '0.0.1'
  }, project.package)
  writePackage(project.dir, project.package)
  // config
  const templatesOption = this.getTemplatesOption()
  project.config = Object.assign({}, project.config)
  project.config.templateNames = this.getTemplateNames()
  project.allTemplateNames = this.getAllTemplateNames()
  this.writeConfig(project.dir, project.config)
  // gitignore
  project.gitignores = [
    'node_modules',
    '*.pyc',
    'venv'
  ]
  writeGitignore(project.dir, project.gitignores)
  // requirements
  project.requirements = [
    'click==5.1'
  ]
  writeRequirements(project.dir, project.requirements)
  // write a configure file
  const configureFileDir = path.join(binDir, 'configure.sh')
  const configureFileString = `npm install --save-dev ${templatesOption}`
  fs.writeFileSync(configureFileDir, configureFileString)
  // configure
  this.setProjectEnvironment()
  this.configure()
}

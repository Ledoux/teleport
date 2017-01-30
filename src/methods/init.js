// INIT TASK
// init is a sub task of create.
// - it inits a package for the project
// - it writes an install file that will help to install the template modules
// - it calls the configure sub task
// - it calls the dump sub task

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { writeGitignore, writePackage } from '../utils/functions'

export function init () {
  const { program, project } = this
  // name
  const name = program.name || project.dir.split('/').slice(-1)[0]
  // dirs
  const binDir = path.join(project.dir, 'bin')
  const nodeModulesDir = path.join(project.dir, 'node_modules')
  const yarnLockFile = path.join(project.dir, 'yarn.lock')
  // exec
  childProcess.execSync(`mkdir -p ${binDir} && rm -rf ${nodeModulesDir} && rm -f ${yarnLockFile}`)
  // package
  project.package = Object.assign({
    name,
    version: '0.0.1'
  }, project.package)
  writePackage(project.dir, project.package)
  // config
  const templatesOption = this.getTemplatesOption()
  project.config = Object.assign({}, project.config)
  project.config.templateNames = this.getTemplateNames()
  this.writeConfig(project.dir, project.config)
  // gitignore
  project.gitignores = [
    '*node_modules',
    '*.pyc',
    '*secret.json',
    '*venv'
  ]
  writeGitignore(project.dir, project.gitignores)
  // write a configure file
  const configureFileDir = path.join(binDir, 'configure.sh')
  const configureFileString = templatesOption !== ''
  // ? `npm install --save-dev ${templatesOption}`
  ? `yarn add --dev ${templatesOption}`
  : ''
  fs.writeFileSync(configureFileDir, configureFileString)
  // write an install file
  const installFileDir = path.join(binDir, 'install.sh')
  const installFileString = 'yarn'
  fs.writeFileSync(installFileDir, installFileString)
  // configure
  this.setProjectEnvironment()
  this.configure()
  // dump
  this.dump()
}

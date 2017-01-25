import fs from 'fs'
import path from 'path'
import stringify from 'json-stable-stringify'

import { writeGitignore, writePackage, writeRequirements } from '../utils'

export function writeConfig (dir, config) {
  const { app: { configFile } } = this
  const fileDir = path.join(dir, configFile)
  const fileString = stringify(config, { space: '\t' })
  fs.writeFileSync(fileDir, fileString)
}

export function writeProjectsByName (projectsByName) {
  const { app: { dir } } = this
  const fileDir = path.join(dir, '.projects.json')
  const fileString = stringify(projectsByName, { space: '\t' })
  fs.writeFileSync(fileDir, fileString)
}

export function write (level) {
  if (level) {
    if (typeof level.dir !== 'string') {
      this.consoleError('level.dir is not correct to write something !')
      return
    }
    this.writeConfig(level.dir, level.config)
    writeGitignore(level.dir, level.gitignores)
    writeRequirements(level.dir, level.requirements)
    writePackage(level.dir, level.package)
  } else {
    this.consoleWarn('You didn\'t mention a level where to write')
  }
}

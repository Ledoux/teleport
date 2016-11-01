import fs from 'fs'
import path from 'path'
import stringify from 'json-stable-stringify'

import { writeGitignore, writePackage, writeRequirements } from '../utils'

export function writeConfig (dir, config) {
  const { app: { configFile } } = this
  fs.writeFileSync(path.join(dir, configFile), stringify(config, { space: '\t' }))
}

export function write (level) {
  if (level) {
    this.writeConfig(level.dir, level.config)
    writeGitignore(level.dir, level.gitignore)
    writeRequirements(level.dir, level.config.requirements)
    writePackage(level.dir, level.package)
  }
}

// READ
// it is a method for concatenate in one method
// all the instructions to read the config file
// at a certain level (but level here can be only project for now)

import { getGitignores, getPackage, getRequirements } from '../utils'

export function read (level) {
  if (level) {
    level.config = this.getConfig(level.dir)
    level.gitignores = getGitignores(level.dir)
    level.package = getPackage(level.dir)
    level.requirements = getRequirements(level.dir)
  }
}

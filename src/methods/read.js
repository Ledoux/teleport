import { getGitignores, getPackage, getRequirements } from '../utils'

export function read (level) {
  if (level) {
    level.config = this.getConfig(level.dir)
    level.gitignores = getGitignores(level.dir)
    level.package = getPackage(level.dir)
    level.requirements = getRequirements(level.dir)
  }
}

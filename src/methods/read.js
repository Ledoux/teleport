import { getGitignore, getPackage } from '../utils'

export function read (level) {
  if (level) {
    level.config = this.getConfig(level.dir)
    level.gitignore = getGitignore(level.dir)
    level.package = getPackage(level.dir)
  }
}

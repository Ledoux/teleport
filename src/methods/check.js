export function checkScope () {
  if (typeof this.scope.dir !== 'string') {
    this.consoleWarn('you need to go inside a scope for this command')
    process.exit()
  }
}

export function checkProject () {
  if (typeof this.project.dir !== 'string') {
    this.consoleWarn('you need to go inside a project for this command')
    process.exit()
  }
}

export function checkWeb () {
  if (this.program.web === 'off') {
    this.consoleError('you need to have internet for this')
    process.exit()
  }
}

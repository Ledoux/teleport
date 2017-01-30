export function checkProject () {
  if (typeof this.project.dir !== 'string') {
    this.consoleWarn('you need to go inside a project for this command')
    process.exit()
  }
}

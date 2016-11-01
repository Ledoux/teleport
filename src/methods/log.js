export function log () {
  if (typeof this.program.method !== 'string') {
    this.consoleWarn('You need to mention a method with the --method option')
    return
  }
  const log = this[this.program.method](this.kwarg)
  this.consoleLog(log)
}

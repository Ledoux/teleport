export function status () {
  const { app } = this
  this.consoleInfo('App status')
  this.consoleConfig(app.config)
  this.consoleInfo(`${this.level} status`)
  this.consoleConfig(this[this.level].config)
}

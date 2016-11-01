export function status () {
  const { app } = this
  this.consoleInfo('App status')
  const appConfig = this.getConfig(app.dir)
  this.consoleConfig(appConfig)
  this.consoleInfo(`${this.level} status`)
  const levelConfig = this.getConfig(this[this.level].dir)
  this.consoleConfig(levelConfig)
}

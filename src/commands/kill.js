const childProcess = require('child_process')

module.exports.getPsDatabaseCommand = function () {
  return 'ps -ax | grep -v grep | grep rethinkdb | awk \'{print $$1}\''
}

module.exports.psDatabase = function () {
  console.log(childProcess.execSync(this.getPsDatabaseCommand()).toString('utf-8'))
}

module.exports.getKillDatabaseCommand = function () {
  const command = this.getPsDatabaseCommand()
  return command === '' ? '' : `kill -9 ${command}`
}

module.exports.killDatabase = function () {
  const command = this.getKillDatabaseCommand()
  command === ''
  ? console.log(childProcess.execSync(command).toString('utf-8'))
  : console.log('There is no rethink database to kill')
}

module.exports.getPsUwsgiCommand = function () {
  return 'ps aux | grep -ie [u]wsgi | awk \'{print $2}\''
}

module.exports.psUwsgi = function () {
  const command = this.getPsUwsgiCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getKillUwsgiCommand = function () {
  const command = this.psUwsgi()
  return command === ''
  ? ''
  : `kill -9 ${command.split('\n').slice(0, -1)}`
}

module.exports.getPsGunicornCommand = function () {
  return 'ps aux | grep -ie [g]unicorn | awk \'{print $2}\''
}

module.exports.psGunicorn = function () {
  const command = this.getPsGunicornCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getKillGunicornCommand = function () {
  const command = this.psGunicorn()
  return command === ''
  ? ''
  : `kill -9 ${command.split('\n').slice(0, -1)}`
}

module.exports.kill = function () {
  this.killDatabase()
}

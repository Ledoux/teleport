import childProcess from 'child_process'

export function getPsDatabaseCommand () {
  return 'ps -ax | grep -v grep | grep rethinkdb | awk \'{print $$1}\''
}

export function psDatabase () {
  console.log(childProcess.execSync(this.getPsDatabaseCommand()).toString('utf-8'))
}

export function getKillDatabaseCommand () {
  const command = this.getPsDatabaseCommand()
  return command === '' ? '' : `kill -9 ${command}`
}

export function killDatabase () {
  const command = this.getKillDatabaseCommand()
  command === ''
  ? console.log(childProcess.execSync(command).toString('utf-8'))
  : console.log('There is no rethink database to kill')
}

export function getPsUwsgiCommand () {
  return 'ps aux | grep -ie [u]wsgi | awk \'{print $2}\''
}

export function psUwsgi () {
  const command = this.getPsUwsgiCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getKillUwsgiCommand () {
  const command = this.psUwsgi()
  return command === ''
  ? ''
  : `kill -9 ${command.split('\n').slice(0, -1)}`
}

export function getPsGunicornCommand () {
  return 'ps aux | grep -ie [g]unicorn | awk \'{print $2}\''
}

export function psGunicorn () {
  const command = this.getPsGunicornCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getKillGunicornCommand () {
  const command = this.psGunicorn()
  return command === ''
  ? ''
  : `kill -9 ${command.split('\n').slice(0, -1)}`
}

export function kill () {
  this.killDatabase()
}

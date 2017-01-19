import childProcess from 'child_process'

export function getPsDatabaseCommand () {
  return 'ps -ax | grep -v grep | grep rethinkdb | awk \'{print $$1}\''
}

export function psDatabase () {
  childProcess.execSync(this.getPsDatabaseCommand(), { stdio: [0, 1, 2] })
}

export function getKillDatabaseCommand () {
  const command = this.getPsDatabaseCommand()
  return command === '' ? '' : `kill -9 ${command}`
}

export function killDatabase () {
  const command = this.getKillDatabaseCommand()
  command === ''
  ? childProcess.execSync(command, { stdio: [0, 1, 2] })
  : console.log('There is no rethink database to kill')
}

export function getPsUwsgiCommand () {
  return 'ps aux | grep -ie [u]wsgi | awk \'{print $2}\''
}

export function psUwsgi () {
  const command = this.getPsUwsgiCommand()
  childProcess.execSync(command, { stdio: [0, 1, 2] })
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
  childProcess.execSync(command, { stdio: [0, 1, 2] })
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

import childProcess from 'child_process'

import { sleep } from '../utils'

const devHosts = ['localhost', '']

export function getRunRethinkCommand () {
  let command = `cd ${this.rethinkDbDataDir} && rethinkdb`
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
  return command
}

export function startDatabase () {
  if (this.program.data === 'localhost') {
    this.databaseState = childProcess.execSync(
      this.getPsDatabaseCommand()
    ).toString('utf-8')
    if (this.databaseState.trim() === '') {
      childProcess.execSync(this.getRunRethinkCommand())
      sleep(2000)
    } else {
      console.log('Rethink localhost is already running')
    }
  }
}

export function getWebrouterBackendDevRunCommand () {
  this.checkProject()
  let commands = [`cd ${this.pythonScriptsDir}`]
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand)
  }
  commands.push('python manage_webrouter.py runserver')
  let command = commands.join(' && ')
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
  return command
}

export function webrouterBackendDevRun () {
  this.checkProject()
  const command = this.getWebrouterBackendDevRunCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function getWebrouterBackendProdRunCommand () {
  this.checkProject()
  let commands = [`cd ${this.backendDir}`]
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand)
  }
  commands.push(`uwsgi --ini config/${this.program.type}_uwsgi.ini`)
  let command = commands.join(' && ')
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
}

export function getWebsocketerBackendProdRunCommand () {
  this.checkProject()
  let commands = [`cd ${this.backendDir}`]
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand)
  }
  commands.push(`gunicorn -c config/${this.program.type}_guwsgi.ini websocketer:app`)
  let command = commands.join(' && ')
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
}

export function setRunOptionsCommand () {
  this.checkProject()
  this.runOptionsCommand = Object.keys(this.runConfig).map(key => {
    return `export ${key}=${this.runConfig[key]}`
  }).join(' && ')
}

export function backendDevRun () {
  this.checkProject()
  this.webrouterBackendDevRun()
  if (this.isWebsocketer) {
    this.websocketerBackendDevRun()
  }
}

export function backendProdRun () {
  this.checkProject()
  this.webrouterBackendProdRun()
  if (this.isWebsocketer) {
    this.websocketerBackendProdRun()
  }
  return this
}

export function getOpenWebrouterWindowCommand () {
  return `open -a Google\\ Chrome \'${this.runConfig['WEBROUTER_URL']}\'`
}

export function openWebrouterWindowCommand () {
  const command = this.getOpenWebrouterWindowCommand()
  childProcess.execSync(command)
}

export function backendRun () {
  this.checkProject()
  this.runConfig = {
    DATA: this.program.data,
    SITE_NAME: this.siteName,
    SMTP_HOST: this.smtpHost,
    TYPE: this.program.type,
    WEB: this.program.web,
    WEBROUTER_URL: this[`${this.program.type}WebrouterUrl`],
    WEBSOCKETER_URL: this[`${this.program.type}WebsocketerUrl`]
  }
  this.setRunOptionsCommand()
  devHosts.includes(this.program.type)
  ? this.backendDevRun()
  : this.backendProdRun()
  console.log(`Go now to ${this.runConfig['WEBROUTER_URL']} to see your app`)
  // sleep a bit to wait that the server is running
  sleep(2000)
  this.openWebrouterWindowCommand()
}

export function run () {
  this.checkProject()
  this.startDatabase()
  this.backendRun()
}

const childProcess = require('child_process')

const devHosts = ['localhost', '']

const sleep = function (milliseconds) {
  var start = new Date().getTime()
  var isSleep = true
  while (isSleep) {
    if ((new Date().getTime() - start) > milliseconds) {
      isSleep = false
    }
  }
}

module.exports.getRunRethinkCommand = function () {
  let command = `cd ${this.rethinkDbDataDir} && rethinkdb`
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
  return command
}

module.exports.startDatabase = function () {
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

module.exports.getWebrouterBackendDevRunCommand = function () {
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

module.exports.webrouterBackendDevRun = function () {
  this.checkProject()
  const command = this.getWebrouterBackendDevRunCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.getWebrouterBackendProdRunCommand = function () {
  this.checkProject()
  let commands = [`cd ${this.backendDir}`]
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand)
  }
  commands.push(`uwsgi --ini config/${this.program.host}_uwsgi.ini`)
  let command = commands.join(' && ')
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
}

module.exports.getWebsocketerBackendProdRunCommand = function () {
  this.checkProject()
  let commands = [`cd ${this.backendDir}`]
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand)
  }
  commands.push(`gunicorn -c config/${this.program.host}_guwsgi.ini websocketer:app`)
  let command = commands.join(' && ')
  if (this.program.user === 'me') {
    command = `${this.ttabDir} \"${command}\"`
  }
}

module.exports.setRunOptionsCommand = function () {
  this.checkProject()
  this.runOptionsCommand = Object.keys(this.runConfig).map(key => {
    return `export ${key}=${this.runConfig[key]}`
  }).join(' && ')
}

module.exports.backendDevRun = function () {
  this.checkProject()
  this.webrouterBackendDevRun()
  if (this.isWebsocketer) {
    this.websocketerBackendDevRun()
  }
}

module.exports.backendProdRun = function () {
  this.checkProject()
  this.webrouterBackendProdRun()
  if (this.isWebsocketer) {
    this.websocketerBackendProdRun()
  }
  return this
}

module.exports.getOpenWebrouterWindowCommand = function () {
  return `open -a Google\\ Chrome \'${this.runConfig['WEBROUTER_URL']}\'`
}

module.exports.openWebrouterWindowCommand = function () {
  const command = this.getOpenWebrouterWindowCommand()
  childProcess.execSync(command)
}

module.exports.backendRun = function () {
  this.checkProject()
  this.runConfig = {
    DATA: this.program.data,
    SITE_NAME: this.siteName,
    WEB: this.program.web
  }
  Object.assign(this.runConfig, {
    DEPLOY: this.program.host,
    WEBROUTER_URL: this[`${this.program.host}WebrouterUrl`],
    WEBSOCKETER_URL: this[`${this.program.host}WebsocketerUrl`]
  })
  this.setRunOptionsCommand()
  devHosts.includes(this.program.host)
  ? this.backendDevRun()
  : this.backendProdRun()
  console.log(`Go now to ${this.runConfig['WEBROUTER_URL']} to see your app`)
  // sleep a bit to wait that the server is running
  sleep(2000)
  this.openWebrouterWindowCommand()
}

module.exports.run = function () {
  this.checkProject()
  this.startDatabase()
  this.backendRun()
}

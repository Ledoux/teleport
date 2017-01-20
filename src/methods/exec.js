import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

const platformScriptNames = [
  'build',
  'deploy',
  'push',
  'run'
]

export function exec () {
  const { app, program, server, type } = this
  let command, scriptFile
  // execute a script
  const script = program.script
  if (typeof script !== 'undefined' && server) {
    let platform = program.platform
    let typedScript = script
    if (platformScriptNames.includes(script) && platform) {
      typedScript = `${platform}_${script}`
    }
    if (type) {
      typedScript = `${type.name}_${script}`
    }
    // find the file
    const scriptFileDir = path.join(server.dir, 'scripts', `${typedScript}.sh`)
    scriptFile = fs.readFileSync(scriptFileDir).toString('utf-8')
    command = `cd ${server.dir} && sh scripts/${typedScript}.sh`
  } else if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that')
    return
  // execute a command
  } else {
    command = program.lang === 'py'
    ? `python ${app.pythonDir} ${program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ')}`
    : this[program.method]()
  }
  // venv check
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  // ttab check
  if (program.ttab === 'true') {
    command = `${app.ttabDir} \"${command}\"`
  }
  if (program.shell !== 'concurrently') {
    this.consoleInfo('Let\'s exec this command !')
    this.consoleLog(command)
    if (scriptFile) {
      this.consoleInfo('Which corresponds to : ')
      this.consoleLog(scriptFile)
    }
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else if (script) {
    this.execAddConcurrently(script, command)
    childProcess.execSync(this[`${script}ConcurrentlyCommands`], { stdio: [0, 1, 2] })
  } else {
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

export function execResetConcurrently (script) {
  this[`${script}ConcurrentlyCommands`] = []
}

export function execAddConcurrently (script, command) {
  if ( this[`${script}ConcurrentlyCommands`] === undefined ) {
    this[`${script}ConcurrentlyCommands`] = []
  }
  this[`${script}ConcurrentlyCommands`].push(command)
}

export function execConcurrentlyOrDirectly(script) {
  const { program } = this
  if (program.shell !== 'concurrently') {
    if (program.user === 'me' && program.ttab === 'true') {
      command = `${command} --ttab true`
      this.consoleInfo(`Let\'s ${script}`)
      this.consoleLog(command)
      childProcess.execSync(command, { stdio: [0, 1, 2] })
    }
  }
  else {
    const concurrentlyCommandsString = this[`${script}ConcurrentlyCommands`]
      .map(concurrentlyCommand => `\"${concurrentlyCommand}\"`)
      .join(' ')
    const command = `${app.concurrentlyDir} --kill-others ${concurrentlyCommandsString}`
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

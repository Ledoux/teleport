import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function exec () {
  const { app, program, server, type } = this
  let command, scriptFile
  // execute a script
  if (typeof program.script !== 'undefined' && server) {
    let script = program.script
    if (type) {
      script = `${type.name}_${script}`
    }
    // find the file
    const scriptFileDir = path.join(server.dir, 'scripts', `${script}.sh`)
    scriptFile = fs.readFileSync(scriptFileDir).toString('utf-8')
    command = `cd ${server.dir} && sh scripts/${script}.sh`
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
  this.consoleInfo('Let\'s exec this command !')
  this.consoleLog(command)
  if (scriptFile) {
    this.consoleInfo('Which corresponds to : ')
    this.consoleLog(scriptFile)
  }
  console.log(childProcess.execSync(command).toString('utf-8'))
}

import childProcess from 'child_process'

export function exec () {
  const { app, program, server, type } = this
  let command
  // execute a script
  if (typeof program.script !== 'undefined' && server) {
    let script = program.script
    if (type) {
      script = `${type.name}_${script}`
    }
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
  if (program.ttab === 'true') {
    command = `${app.ttabDir} \"${command}\"`
  }
  this.consoleInfo('Let\'s exec this command !')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

import childProcess from 'child_process'

export function exec () {
  const { app, program } = this
  if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that')
    return
  }
  const command = program.lang === 'py'
  ? `python ${app.pythonDir} ${program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ')}`
  : this[program.method]()
  console.log(
    childProcess.execSync(command).toString('utf-8'))
}

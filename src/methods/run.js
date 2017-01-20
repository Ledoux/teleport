import childProcess from 'child_process'

export function run () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let commands = []
  commands.push(`tpt -e --script run --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  if (program.user === 'me' && program.ttab === 'true') {
    command = `${command} --ttab true`
  }
  this.consoleInfo('Let\'s push')
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

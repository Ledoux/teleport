import childProcess from 'child_process'

export function run () {
  const { program } = this
  // reset
  this.execResetConcurrently('push')
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let commands = []
  commands.push(`tpt -e --script run --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

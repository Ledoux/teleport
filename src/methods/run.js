import childProcess from 'child_process'

export function run () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }

  const command = `tpt -e --script push --type ${program.type} --platform ${program.platform} --servers all`
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

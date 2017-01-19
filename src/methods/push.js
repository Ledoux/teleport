import childProcess from 'child_process'

export function push () {
  const { program } = this
  // reset
  this.execResetConcurrently('push')
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let commands = []
  commands.push(`tpt -e --script push --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  // exec
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

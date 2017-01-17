import childProcess from 'child_process'

export function uninstall () {
  this.uninstallPythonDependencies()
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let commands = []
  commands.push(`tpt -e --script uninstall --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  if (program.user === 'me') {
    command = `${command} --ttab true`
  }
  this.consoleInfo('Let\'s push')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function uninstallPythonDependencies () {
  this.consoleInfo('Let\'s uninstall all in the venv')
  const command = `source ${process.env.VIRTUAL_ENV}/bin/activate && pip freeze | grep -v "^-e" | xargs pip uninstall -y`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

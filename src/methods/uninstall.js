import childProcess from 'child_process'

export function uninstall () {
  this.uninstallPythonDependencies()
}

export function uninstallPythonDependencies () {
  this.consoleInfo('Let\'s uninstall all in the venv')
  const command = `source ${process.env.VIRTUAL_ENV}/bin/activate && pip freeze | grep -v "^-e" | xargs pip uninstall -y`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

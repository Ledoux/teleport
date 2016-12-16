import childProcess from 'child_process'

export function uninstall () {
  this.uninstallPythonDependencies()
}

export function uninstallPythonDependencies () {
  const { project } = this
  this.consoleInfo('Let\'s uninstall all in the venv')
  const command = `source ${project.config.venv}/bin/activate && pip freeze | grep -v "^-e" | xargs pip uninstall -y`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

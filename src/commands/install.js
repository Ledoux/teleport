const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports.getInstallPythonLibCommand = function () {
  const sudo = this.program.permission
  const commands = [`cd ${this.projectDir} && source venv/bin/activate`]
  this.webrouterBaseRequirementsDir = path.join(
    this.appImagesDir, this.projectAppConfig.webrouterBaseTag, 'config/requirements_webrouter.txt')
  if (fs.existsSync(this.webrouterBaseRequirementsDir)) {
    commands.push(`cd ${this.projectDir} && pip install -r ${this.webrouterBaseRequirementsDir}`)
  }
  this.websocketerBaseRequirementsDir = path.join(
    this.appImagesDir, this.projectAppConfig.websocketerBaseTag, 'config/requirements_websocketer.txt')
  if (fs.existsSync(this.websocketerBaseRequirementsDir)) {
    commands.push(`cd ${this.projectDir} && pip install -r ${this.websocketerBaseRequirementsDir}`)
  }
  // for some reason, some python lib requires sudo install even if we are in venv mode
  commands.push(`cd ${this.projectDir} && ${sudo} pip install -r ${this.webrouterRequirementsDir}`)
  commands.push(`cd ${this.projectDir} && pip install -r ${this.websocketerRequirementsDir}`)
  return commands.join(' && ')
}

module.exports.installPythonLib = function () {
  const command = this.getInstallPythonLibCommand()
  this.consoleInfo(`...Installing the python deps in your venv, it can take a little of time, and if you meet permission errors, do it in sudo, with the \'--permission sudo\' option, like \'tpt -c --permission sudo\'`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.install = function () {
  if (this.projectAppConfig.python) {
    this.installPythonLib()
  }
}

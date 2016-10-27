const childProcess = require('child_process')

module.exports.getConfigureKubernetesCommand = function () {
  let commands = [`cd ${this.appBinDir}`]
  commands.push(`export MASTER_SERVER=${this.appConfig.masterServer}`)
  commands.push('make configure-kubectl')
  return commands.join(' && ')
}

module.exports.configureKubernetes = function () {
  const command = this.getConfigureKubernetesCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.configure = function () {
  this.configureKubernetes()
}

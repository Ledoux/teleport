import childProcess from 'child_process'

export function getConfigureKubernetesCommand () {
  const { backend, app } = this
  let commands = [`cd ${app.binDir}`]
  commands.push(`export MASTER_SERVER=${backend.masterServer}`)
  commands.push('make configure-kubectl')
  return commands.join(' && ')
}

export function configureKubernetes () {
  this.consoleInfo('Let\'s configure kubernetes')
  const command = this.getConfigureKubernetesCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  console.log('kubernetes is configured !')
}

export function configure () {
  this.configureKubernetes()
}

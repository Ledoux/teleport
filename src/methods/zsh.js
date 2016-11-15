import childProcess from 'child_process'

export function getZshCommand () {
  this.checkProject()
  const { project, server, type, run } = this
  const command = `docker ${type.socket} run -t -i ${run.tag} /bin/zsh`
  return [
    `cd ${server.dir}`,
    command,
    `cd ${project.dir}`
  ].join(' && ')
}

export function zsh () {
  const command = this.getZshCommand()
  this.consoleInfo(`Ok we zsh into your container...`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

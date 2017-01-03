import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function build () {
  const { project, program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  let commands = []
  if (fs.existsSync(path.join(project.dir, 'bin/bundle.sh'))) {
    commands.push(`cd ${project.dir} && sh bin/bundle.sh`)
  }
  commands.push(`tpt -e --script build --helper ${program.helper} --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  if (program.user === 'me') {
    command = `${command} --ttab true`
  }
  this.consoleInfo('Let\'s build')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

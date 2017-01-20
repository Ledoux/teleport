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
  commands.push(`tpt -e --script build --type ${program.type} --servers all`)
  let command = commands.join(' && ')
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

// BUILD SUB TASK
// build is called at the deploy task time, but you can also call it in an already
// created project. It is here about to build the heroku git repositories/docker images
// of each server that will help then to deploy the whole project. 
// - build goes to each server and execute their scripts/<type>_<platform>_build.sh
// script.

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
  commands.push(`tpt -e --script build --type ${program.type} --platform ${program.platform} --servers all`)
  let command = commands.join(' && ')
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

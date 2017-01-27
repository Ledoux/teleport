// DEPLOY TASK
// deploy is the last task that to call when you want to push a project
// outside of your localhost environment, given a certain typed context.
// (Usually type can be "staging" or "production")
// - it first checks if we need to bundle the frontend part.
// - it then calls, for each server, the deploy method that will execute their scripts/<type>_deploy.sh
// a deploy consists mainly of build, push and run sub tasks.

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function deploy () {
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
  commands.push(`tpt -e --script deploy --type ${program.type} --platform ${program.platform} --servers all`)
  let command = commands.join(' && ')
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

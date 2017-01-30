// RUN SUB TASK
// run is called at the deploy task time, but you can also call it in an already
// created project. It is here about to run the heroku dynos/docker container
// of each server that will help then to deploy the whole project.
// - run goes to each server and execute their scripts/<type>_<platform>_run.sh
// script.

import childProcess from 'child_process'

export function run () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }

  const command = `tpt -e --script push --type ${program.type} --platform ${program.platform} --servers all`
  // exec
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

// CONFIGURE CHECK UTILITY
// check

import childProcess from 'child_process'

export function check () {
  const { app } = this
  const command = `${app.concurrentlyDir} \"cd ${app.dir} && yarn run check\"`
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

export function checkProject () {
  if (typeof this.project.dir !== 'string') {
    this.consoleWarn('you need to go inside a project for this command')
    process.exit()
  }
}

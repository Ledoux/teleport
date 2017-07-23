// BUNDLE SUB TASK
// bundle is the task that will bundle your project locally.
// - it goes to each server and execute their scripts/$TYPE_bundle.sh
// script.
// - if $TYPE is development, it runs the server of assets and scripts that you may have if you have a frontend
// bundler like webpack, otherwise it triggers a bundle prod

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function bundle () {
  const { app, program, project } = this
  if (!fs.existsSync(path.join(project.dir, 'bundler'))) return
  let command = `cd ${project.dir} && sh bin/`
  command = program.type === 'development'
  ? `${command}development_bundle.sh`
  : `${command}bundle.sh`
  this.consoleInfo('Let\'s bundle')
  this.consoleLog(command)
  childProcess.execSync(command, { stdio: [0, 1, 2] })
}

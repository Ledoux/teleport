// DEPLOY TASK
// deploy is the last task that to call when you want to push a project
// outside of your development environment, given a certain typed context.
// (Usually type can be "staging" or "production")
// - it first checks if we need to bundle the frontend part.
// - it then calls, for each server, the deploy method that will execute their scripts/<type>_deploy.sh
// a deploy consists mainly of build, push and run sub tasks.

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

export function deploy () {
  const { project, program } = this
  // type is development by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'development') {
    program.type = 'staging'
  }
  this.setTypeEnvironment()
  // we need first to check if we need to bundle a frontend
  if (fs.existsSync(path.join(project.dir, 'bin/bundle.sh'))) {
    const command = `cd ${project.dir} && sh bin/bundle.sh`
    this.consoleLog(command)
    console.log(childProcess.execSync(command).toString('utf-8'))
  }
  // then we map the deploy for each server given the type
  this.program = Object.assign(this.program, {
    deploy: false,
    method: 'exec',
    script: 'deploy'
  })
  this.mapInServers()
  // display
  console.log('You server urls are')
  this.getUrls()
}

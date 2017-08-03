// PUSH SUB TASK
// push is called at the deploy task time, but you can also call it in an already
// created project. It is here about to push the heroku git repositories/docker images
// of each server that will help then to deploy the whole project.
// - push goes to each server and execute their scripts/<type>_<platform>_push.sh
// script.

export function push () {
  const { program } = this
  // type is development by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'development') {
    program.type = 'staging'
  }
  this.setTypeEnvironment()
  // we map the build for each server given the type
  this.program = Object.assign(this.program, {
    deploy: false,
    method: 'exec',
    script: 'push'
  })
  this.mapInServers()
}

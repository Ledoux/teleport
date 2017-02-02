// RUN SUB TASK
// run is called at the deploy task time, but you can also call it in an already
// created project. It is here about to run the heroku dynos/docker container
// of each server that will help then to deploy the whole project.
// - run goes to each server and execute their scripts/<type>_<platform>_run.sh
// script.

export function run () {
  const { program } = this
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here
  if (program.type === 'localhost') {
    program.type = 'staging'
  }
  this.setTypeEnvironment()
  // we map the build for each server given the type
  this.program = Object.assign(this.program, {
    deploy: false,
    method: 'exec',
    script: 'run'
  })
  this.mapInServers()
}

// EXEC UTILITY
// exec is not a task. But it is still a very useful command for quickly execute
// any kind of the Teleport methods. Look at the jest tests.
// - tpt -e --script build --type staging --server express-webrouter, for instance
// will execute the scripts/staging_build.sh script found in your express webrouter server.
// - if no script arg is specified, then you can mention a method, and Teleport will execute it
// like for instance tpt -e --method getConfig
// - you can also specify the python language '--lang py', and in that case, it will a python
// method from the python teleport part that can be called

import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

const platformScriptNames = [
  'build',
  'deploy',
  'push',
  'run'
]

export function exec () {
  const { app, program, project, server, type } = this
  let command, scriptFile
  // execute a script
  const script = program.script
  if (typeof script !== 'undefined' && server) {
    let platform = program.platform
    let typedScript = script
    // look how many platforms we have
    if (typeof project.platformTemplateNames === 'undefined') {
      project.platformTemplateNames = this.getPlatformTemplates()
    }
    // if there is only one platform to deploy, then necessary force
    // the deploy on that one
    if (project.platformTemplateNames.length === 1) {
      platform = project.platformTemplateNames[0].replace('teleport-', '')
    }
    // check
    if (
      platformScriptNames.includes(script) && platform &&
      // NOTE : this is where we need to do a little hacky workaround.
      // our default platform value is heroku, but our scripts in our templates
      // are by default kubernetes if they don't have a prefix platform
      platform !== 'kubernetes' && platform !== 'snips'
    ) {
      typedScript = `${platform}_${script}`
    }
    if (type) {
      typedScript = `${type.name}_${typedScript}`
    }
    // find the file
    const scriptFileDir = path.join(server.dir, 'scripts', `${typedScript}.sh`)
    scriptFile = fs.readFileSync(scriptFileDir).toString('utf-8')
    command = `cd ${server.dir} && sh scripts/${typedScript}.sh`
  } else if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that')
    return
  // check if it is a python command
  } else if (program.lang === 'py') {
    command = `python ${app.pythonDir} ${program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ')}`
  } else {
    // then it is not a script or python command to process
    // it is a node method to call
    // we can return after
    this.consoleInfo(`Let\'s exec this method ${program.method}`)
    return this[program.method]()
  }
  // venv check
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  if (program.shell !== 'concurrently') {
    this.consoleInfo('Let\'s exec this command !')
    this.consoleLog(command)
    if (scriptFile) {
      this.consoleInfo('Which corresponds to : ')
      this.consoleLog(scriptFile)
    }
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else if (script) {
    this.execAddConcurrently(script, command)
    // execute the whole if it is the end of the combination
    if (this.mapIndex === (this.mapLength -1)) {
      this.execConcurrentlyOrDirectly(script)
    }
  } else {
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

export function execAddConcurrently (script, command) {
  const concurrentlyCommandsString = `${script}ConcurrentlyCommands`
  if (typeof this[concurrentlyCommandsString] === 'undefined') (
    this[concurrentlyCommandsString] = []
  )
  this[`${script}ConcurrentlyCommands`].push(command)
}

export function execConcurrentlyOrDirectly(script) {
  const { app, program } = this
  if (program.shell !== 'concurrently') {
    this.consoleInfo(`Let\'s ${script}`)
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
  else if (program.process === 'sync') {
    // NOTE: unfortunately, when we need to deploy several servers,
    // we cannot throw the heroku deploy commands
    // into parallel concurrently processed.
    // So we keep using concurrently to still display on the fly
    // the logs from the child processes but they are still sync.
    const command = this[`${script}ConcurrentlyCommands`]
      .map(concurrentlyCommand => `${app.concurrentlyDir} \"${concurrentlyCommand}\"`)
      .join(' && ')
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  } else {
    const concurrentlyCommandsString = this[`${script}ConcurrentlyCommands`]
      .map(concurrentlyCommand => `\"${concurrentlyCommand}\"`)
      .join(' ')
    const command = `${app.concurrentlyDir} --kill-others ${concurrentlyCommandsString}`
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

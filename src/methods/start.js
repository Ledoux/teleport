// START SUB TASK
// start is the task that will run your project locally.
// - it goes to each server and execute their scripts/$TYPE_start.sh
// script.
// - if $TYPE is development, it runs the server of assets and scripts that you may have if you have a frontend
// bundler like webpack, otherwise it triggers a bundle prod


import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

import { sleep } from '../utils/functions'

export function start () {
  const { app, program } = this
  this.checkProject()
  if (program.shell === 'concurrently') {
    this.concurrentlyCommands = []
  }
  // NOTE: normally these commands execute directly,
  // but for the concurrently shell they are instead pushed to the
  // this.concurrentlyCommands array, and executed together below
  this.backendStart()
  if (program.type === 'development' || program.type === 'localhost') {
    this.bundlerStart()
  }
  // display
  console.log('You server urls are')
  this.getUrls()
  console.log('\n\n')
  if (program.shell === 'concurrently') {
    const concurrentlyCommandsString = this.concurrentlyCommands
      .map(concurrentlyCommand => `\"${concurrentlyCommand}\"`)
      .join(' ')
    const command = `${app.concurrentlyDir} --kill-others ${concurrentlyCommandsString}`
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

export function backendStart () {
  this.checkProject()
  const { backend, program } = this
  if (!backend) return
  this.startProviders()
  this.startServers()
}

export function startProviders () {
  const { program } = this
  program.method = 'startProvider'
  this.mapInProviders()
}

export function startProvider () {
  this.checkProject()
  const { program, provider } = this
  if (!provider) return
  if (program.data === 'localhost' && fs.existsSync(provider.startDir)) {
    const psResult = childProcess.execSync(
      this.getPsProviderCommand()
    ).toString('utf-8')
    if (psResult.trim() === '') {
      childProcess.execSync(this.getStartProviderCommand())
      sleep(2000)
    } else {
      console.log(`${provider.name} localhost is already starting`)
    }
  }
}

export function getPsProviderCommand () {
  return ''
}

export function getStartProviderCommand () {
  const { app, program, provider } = this
  let command = `cd ${provider.dataDir} && sh start.sh`
  return command
}

export function startServers () {
  const { program } = this
  program.method = 'startServer'
  this.mapInServers()
}

export function startServer () {
  this.checkProject()
  const { program, run, server } = this
  if (!server) return
  const command = this.getStartServerCommand()
  if (program.shell !== 'concurrently') {
    this.consoleInfo(`Let\'s start the ${server.name} server`)
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
    console.log(`${server.name} serves at http://localhost:${run.port}`)
  } else {
    this.concurrentlyCommands.push(command)
  }
}

export function getStartServerCommand () {
  const { app, program, server, type } = this
  const commands = []
  let fileName
  // for old versions of templates, development type is named
  // as localhost... so we need to keep that as a break guard
  if (program.type === 'development') {
    fileName = 'development_start.sh'
    if (!fs.existsSync(path.join(server.dir, 'scripts', fileName))) {
      fileName = 'localhost_start.sh'
    }
  } else {
    fileName = 'sandbox_start.sh'
  }
  commands.push(`export TYPE=${type.name}`)
  commands.push(`cd ${server.dir}`)
  commands.push(`sh scripts/${fileName}`)
  let command = commands.join(' && ')
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  return command
}

export function bundlerStart () {
  const { program } = this
  const command = this.getBundleCommand()
  if (program.type === 'development' && program.shell === 'concurrently') {
    this.concurrentlyCommands.push(command)
  } else {
    this.consoleInfo('Let\'s start the bundler')
    this.consoleLog(command)
    childProcess.execSync(command, { stdio: [0, 1, 2] })
  }
}

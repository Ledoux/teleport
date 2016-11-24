import childProcess from 'child_process'
import fs from 'fs'

import { sleep } from '../utils'

export function start () {
  this.checkProject()
  this.backendStart()
}

export function backendStart () {
  this.checkProject()
  const { backend, program } = this
  if (!backend) return
  this.startProviders()
  program.type = 'localhost'
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
  if (program.user === 'me') {
    command = `${app.ttabDir} \"${command}\"`
  }
  return command
}

export function startServers () {
  const { program } = this
  program.method = 'startServer'
  this.mapInServers()
}

export function startServer () {
  this.checkProject()
  const { run, server } = this
  if (!server) return
  const command = this.getStartServerCommand()
  this.consoleInfo(`Let\'s start the ${server.name} server`)
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  console.log(`Go now to http://localhost:${run.port} to see your app`)
  // sleep a bit to wait that the server is startning
  sleep(3000)
  this.openServerWindow()
}

export function getStartServerCommand () {
  const { app, program, server, type } = this
  const commands = []
  const fileName = 'localhost_start.sh'
  commands.push(`export MODE=${type.name}`)
  commands.push(`cd ${server.dir}`)
  commands.push(`sh scripts/${fileName}`)
  let command = commands.join(' && ')
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  if (program.user === 'me') {
    command = `${app.ttabDir} \"${command}\"`
  }
  return command
}

export function getOpenServerWindow () {
  const { run } = this
  const url = `http://localhost:${run.port}`
  return `open -a Google\\ Chrome \'${url}\'`
}

export function openServerWindow () {
  const command = this.getOpenServerWindow()
  childProcess.execSync(command)
}

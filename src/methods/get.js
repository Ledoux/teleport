import childProcess from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

import { getPackage, toTitleCase } from '../utils'

export function get () {
  const getValue = this.kwarg === '.'
  ? this
  : _.get(this, this.kwarg)
  console.log(stringify(getValue, {space: ' '}))
}

export function getConfig (dir) {
  const { app: { configFile, package: {name} } } = this
  let config
  // check first for some attributes in package.json
  const localPackage = getPackage(dir)
  if (localPackage && localPackage[name]) {
    config = _.merge({}, localPackage[name])
  }
  // then merge the config if it already exists
  const configDir = path.join(dir, configFile)
  if (fs.existsSync(configDir)) {
    config = _.merge(config, JSON.parse(fs.readFileSync(configDir)))
  }
  // return
  return config
}

export function getAppConfig (dir) {
  return JSON.stringify(this.getConfig(this.app.dir), null, 2)
}

export function getLevelMethod (command) {
  const methodName = `${command}${toTitleCase(this.level)}`
  const method = this[methodName]
  if (typeof method === 'undefined') {
    this.consoleError(`Sorry there is no such ${methodName} method`)
    process.exit()
  }
  return method
}

export function getAvailablePorts (docker) {
  const { run } = this
  docker = docker || run.docker
  this.checkWeb()
  const { app } = this
  const command = `python ${app.pythonBinDir} ports --filter available --docker ${docker}`
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

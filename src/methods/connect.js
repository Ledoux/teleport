// CONNECT SUB TASK
// connect is called at the replace sub task time, it is particularly related
// to the docker deploy config.
// - it looks if the ports for each of your server were specified. If not, it will then
// give to them some that are available given the range of ports that your docker platform
// can still share.

import { values } from 'lodash'

export function connect () {
  this.connectPorts()
}

export function connectPorts () {
  this.checkProject()
  const { project: { config, dir } } = this
  this.availablePortsByInfraName = {}
  values(config.typesByName)
  .forEach(type => {
    if (type.infraName) {
      this.availablePortsByInfraName[type.infraName] = this.getAvailablePorts(type.infraName)
    }
  })
  if (config.backend && config.backend.serversByName) {
    Object.keys(config.backend.serversByName)
      .forEach((serverName, index) => {
        const server = config.backend.serversByName[serverName]
        Object.keys(config.typesByName).forEach(typeName => {
          let run = server.runsByTypeName[typeName]
          if (typeof run === 'undefined') {
            run = server.runsByTypeName[typeName] = {}
          }
          const infraName = run.infraName || config.typesByName[typeName].infraName
          if (typeof infraName === 'undefined') {
            return
          }
          if (this.availablePortsByInfraName[infraName]) {
            const availablePorts = this.availablePortsByInfraName[infraName]
            if (availablePorts.length < 1) {
              this.consoleWarn('The required ports are unavailable. Free them up and retry.')
              process.exit()
            }
            run.port = availablePorts[0].toString()
            this.availablePortsByInfraName[infraName] = availablePorts.slice(1)
          }
        })
      })
  }
  this.writeConfig(dir, config)
}

import { values } from 'lodash'

export function connect () {
  this.connectPorts()
}

export function connectPorts () {
  this.checkProject()
  this.checkWeb()
  const { project: { config, dir } } = this
  this.availablePortsBySubDomain = {}
  values(config.typesByName)
  .forEach(type => {
    if (type.subDomain) {
      this.availablePortsBySubDomain[type.subDomain] = this.getAvailablePorts(type.subDomain)
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
          const subDomain = run.subDomain || config.typesByName[typeName].subDomain
          if (typeof subDomain === 'undefined') {
            return
          }
          if (this.availablePortsBySubDomain[subDomain]) {
            const availablePorts = this.availablePortsBySubDomain[subDomain]
            if (availablePorts.length < 1) {
              this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.')
              process.exit()
            }
            run.port = availablePorts[0].toString()
            this.availablePortsBySubDomain[subDomain] = availablePorts.slice(1)
          }
        })
      })
  }
  this.writeConfig(dir, config)
}

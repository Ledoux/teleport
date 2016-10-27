const fs = require('fs')

const {formatString} = require('../utils')

const clientNames = ['localhost', 'unname', 'staging', 'prod']
const hostNames = ['localhost', 'unname', 'staging', 'prod']
const namedHostNames = ['staging', 'prod']
const serverNames = ['webrouter', 'websocketer']
const uwsgiNames = ['uwsgi', 'guwsgi']

module.exports.specifyDockerPlaceHolders = function () {
  hostNames.filter(hostName => hostName !== 'localhost')
    .forEach(hostName => {
      serverNames.forEach(serverName => {
        const fileName = `${hostName}_${serverName}_Dockerfile`
        const fileDir = `${this.backendDir}/${fileName}`
        const file = fs.readFileSync(fileDir, 'utf-8')
        fs.writeFileSync(fileDir, formatString(file, this))
      })
    })
}

module.exports.specifyServicePlaceHolders = function () {
  namedHostNames.forEach(namedHostName => {
    serverNames.forEach(serverName => {
      const fileName = `${namedHostName}_${serverName}_service.yaml`
      const fileDir = `${this.backendConfigDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir, formatString(file, this))
    })
  })
  return this
}

module.exports.specifyControllerPlaceHolders = function () {
  namedHostNames.forEach(namedHostName => {
    serverNames.forEach(serverName => {
      const fileName = `${namedHostName}_${serverName}_controller.yaml`
      const fileDir = `${this.backendConfigDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir, formatString(file, this))
    })
  })
  return this
}

module.exports.specifyUwsgiPlaceHolders = function () {
  hostNames.forEach(hostName => {
    uwsgiNames.forEach(uwsgiName => {
      const fileName = `${hostName}_${uwsgiName}.ini`
      const fileDir = `${this.backendConfigDir}/${fileName}`
      const file = fs.readFileSync(fileDir, 'utf-8')
      fs.writeFileSync(fileDir, formatString(file, this))
    })
  })
  return this
}

module.exports.specifyClientSecretPlaceHolders = function () {
  clientNames.forEach(clientName => {
    const fileName = `${clientName}_client_secret.json`
    const fileDir = `${this.backendConfigDir}/${fileName}`
    const file = fs.readFileSync(fileDir, 'utf-8')
    fs.writeFileSync(fileDir, formatString(file, this))
  })
  return this
}

module.exports.specify = function () {
  this.specifyDockerPlaceHolders()
  this.specifyServicePlaceHolders()
  this.specifyControllerPlaceHolders()
  this.specifyClientSecretPlaceHolders()
  this.specifyUwsgiPlaceHolders()
}

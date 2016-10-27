const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const dockerKeys = [
  'buildPushDockerHost',
  'maintainer',
  'dockerPort',
  'registryServer',
  'unnameDockerHost',
  'stagingDockerHost',
  'prodDockerHost',
  'dockerVersion',
  'webrouterBaseDockerVersion',
  'webrouterBaseTag',
  'websocketerBaseDockerVersion',
  'websocketerBaseTag',
  'localhostWebrouterHost',
  'localhostWebrouterPort',
  'localhostWebsocketerHost',
  'localhostWebsocketerPort',
  'unnameWebrouterHost',
  'unnameWebrouterPort',
  'unnameWebsocketerHost',
  'unnameWebsocketerPort',
  'stagingWebrouterHost',
  'stagingWebrouterPort',
  'stagingWebsocketerHost',
  'stagingWebsocketerPort',
  'prodWebrouterHost',
  'prodWebsocketerHost',
  'prodWebrouterPort',
  'prodWebsocketerPort',
  'siteName',
  'isWebsocketer'
]

module.exports.setBackendEnvironment = function () {
  // backend env
  this.backendDir = path.join(this.projectDir, 'backend')
  this.backendConfigDir = path.join(this.backendDir, 'config')
  this.webrouterRequirementsDir = path.join(this.backendConfigDir, 'webrouter_requirements.txt')
  this.websocketerRequirementsDir = path.join(this.backendConfigDir, 'websocketer_requirements.txt')
  this.backendConstantsDir = path.join(this.backendConfigDir, 'constants.json')
  this.pythonLibDir = path.join(this.backendDir, 'lib')
  this.pythonScriptsDir = path.join(this.backendDir, 'scripts')
  this.webrouterDir = path.join(this.backendDir, 'webrouter')
  this.websocketerDir = path.join(this.backendDir, 'websocketer')
  dockerKeys.forEach(key => {
    this[key] = this.projectAppConfig[key] || this.appConfig[key]
  })
  this.webrouterBaseImageDir = path.join(this.appImagesDir, this.webrouterBaseTag)
  this.websocketerBaseImageDir = path.join(this.appImagesDir, this.websocketerBaseTag)
  this.buildPushDockerServer = `${this.buildPushDockerHost}:${this.dockerPort}`
  this.buildPushSocket = `-H tcp://${this.buildPushDockerServer}`
  this.isNoCache = false
  this.stagingDockerServer = `${this.stagingDockerHost}:${this.dockerPort}`
  this.prodDockerServer = `${this.prodDockerHost}:${this.dockerPort}`
  this.unnameSocket = `-H tcp://${this.unnameDockerServer}`
  this.stagingSocket = `-H tcp://${this.stagingDockerServer}`
  this.prodSocket = `-H tcp://${this.unnameDockerServer}`
  this.webrouterBaseImage = `${this.registryServer}/${this.webrouterBaseTag}:${this.webrouterBaseDockerVersion}`
  this.websocketerBaseImage = `${this.registryServer}/${this.websocketerBaseTag}:${this.websocketerBaseDockerVersion}`
  this.localhostWebrouterUrl = `http://${this.localhostWebrouterHost}`
  if (this.localhostWebrouterPort !== null) {
    this.localhostWebrouterUrl += ':' + this.localhostWebrouterPort
  }
  this.localhostWebsocketerUrl = `http://${this.localhostWebsocketerHost}`
  if (this.localhostWebsocketerPort !== null) {
    this.localhostWebsocketerUrl += ':' + this.localhostWebsocketerPort
  }
  // Note : we use the short prefix unm for unname, because we have to be careful that
  // the tag length is smaller than 24 characters
  this.siteName = this.siteName || this.projectName
  this.webrouterTag = `${this.siteName}-wbr`
  this.websocketerTag = `${this.siteName}-wbs`
  this.unnameWebrouterTag = `unm-${this.webrouterTag}`
  this.unnameWebsocketerTag = `unm-${this.websocketerTag}`
  this.unnameWebrouterImage = `${this.registryServer}/${this.unnameWebrouterTag}:${this.dockerVersion}`
  this.unnameWebsocketerImage = `${this.registryServer}/${this.unnameWebsocketerTag}:${this.dockerVersion}`
  this.unnameWebrouterHost = this.unnameDockerHost
  this.unnameWebsocketerHost = this.unnameDockerHost
  this.unnameWebrouterUrl = `http://${this.unnameWebrouterHost}`
  if (this.unnameWebrouterPort !== null) {
    this.unnameWebrouterUrl += ':' + this.unnameWebrouterPort
  }
  this.unnameWebsocketerUrl = `http://${this.unnameWebsocketerHost}`
  if (this.unnameWebsocketerPort !== null) {
    this.unnameWebsocketerUrl += ':' + this.unnameWebsocketerPort
  }

  this.prodWebrouterTag = this.webrouterTag
  this.prodWebsocketerTag = this.websocketerTag
  this.prodWebrouterImage = `${this.registryServer}/${this.prodWebrouterTag}:${this.dockerVersion}`
  this.prodWebsocketerImage = `${this.registryServer}/${this.prodWebsocketerTag}:${this.dockerVersion}`
  this.prodWebrouterHost = this.projectAppConfig.webrouterHost || `${this.siteName}.corp.snips.ai`
  this.prodWebsocketerHost = this.projectAppConfig.websocketerHost || `${this.siteName}-websocketer.corp.snips.ai`
  this.prodWebrouterUrl = `https://${this.prodWebrouterHost}`
  this.prodWebsocketerUrl = `https://${this.prodWebsocketerHost}`
  this.regularSiteName = this.siteName.toUpperCase()
  this.webrouterVirtualName = `${this.regularSiteName}_WBR_SERVICE_HOST`
  this.websocketerVirtualName = `${this.regularSiteName}_WBS_SERVICE_HOST`
  this.prodWebrouterVirtualName = this.webrouterVirtualName
  this.prodWebsocketerVirtualName = this.websocketerVirtualName
  // the staging host should be like the prod one except that we prefix all the
  // docker variables by 'staging' to not overide the prod running ones
  this.stagingWebrouterTag = `stg-${this.webrouterTag}`
  this.stagingWebsocketerTag = `stg-${this.websocketerTag}`
  this.stagingWebrouterImage = `${this.registryServer}/${this.stagingWebrouterTag}:${this.dockerVersion}`
  this.stagingWebsocketerImage = `${this.registryServer}/${this.stagingWebsocketerTag}:${this.dockerVersion}`
  this.stagingWebrouterHost = this.projectAppConfig.stagingwebrouterHost || `staging-${this.prodWebrouterHost}`
  this.stagingWebsocketerHost = this.projectAppConfig.stagingWebsocketerHost || `staging-${this.prodWebsocketerHost}`
  this.stagingWebrouterUrl = `https://${this.stagingWebrouterHost}`
  this.stagingWebsocketerUrl = `https://${this.stagingWebsocketerHost}`
  this.stagingWebrouterVirtualName = `STG_${this.webrouterVirtualName}`
  this.stagingWebsocketerVirtualName = `STG_${this.websocketerVirtualName}`
  // run env
  this.dataDir = path.join(this.backendDir, 'data')
  this.jsonDataDir = path.join(this.backendDir, 'json_data')
  this.rethinkDbDataDir = path.join(this.dataDir, 'rethinkdb_data')
}

module.exports.init = function (program) {
  // set attributes
  this.program = program
  this.appDir = path.join(__dirname, '../../')
  this.appBinDir = path.join(this.appDir, 'bin')
  this.appNodeModulesDir = path.join(this.appDir, 'node_modules')
  this.appImagesDir = path.join(this.appDir, 'images')
  this.appUtilsDir = path.join(this.appDir, 'utils')
  this.appPythonBinDir = path.join(this.appBinDir, 'index.py')
  this.ttabDir = path.join(this.appNodeModulesDir, 'ttab/bin/ttab')
  this.appTemplatesDir = path.join(this.appDir, 'templates')
  this.appPackageDir = path.join(this.appDir, 'package.json')
  this.appPackage = JSON.parse(fs.readFileSync(this.appPackageDir))
  this.appName = this.appPackage.name
  this.appConfig = this.appPackage[this.appName]
  this.appStateDir = path.join(this.appDir, `.${this.appName}.json`)
  this.appState = {}
  if (!fs.existsSync(this.appStateDir)) {
    fs.writeFileSync(this.appStateDir,
      JSON.stringify(this.appState, null, 2))
  }
  this.appState = JSON.parse(fs.readFileSync(this.appStateDir))

  // project env
  if (process.cwd() === this.appDir.replace(/\/$/, '')) {
    return
  }
  this.projectDir = process.cwd()
  this.projectPackageDir = path.join(this.projectDir, 'package.json')
  this.projectPackage = JSON.parse(fs.readFileSync(this.projectPackageDir))
  this.projectName = this.projectPackage.name
  this.projectAppConfig = this.projectPackage[this.appName]
  this.setBackendEnvironment()
}

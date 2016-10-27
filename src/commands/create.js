const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports.getCopyTemplateCommand = function () {
  if (typeof this.program.template !== 'string') {
    this.consoleWarn('You didn\'t mention any particular template, please add --template <your_template_name> in your command')
    return
  }
  if (typeof this.program.name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command')
    return
  }
  const templateDir = path.join(this.appTemplatesDir, this.program.template)
  return `cp -R ${templateDir}/ ${this.program.name}`
}

module.exports.createPackage = function () {
  this.projectPackage.name = this.program.name
  this.projectName = this.projectPackage.name
  // like available ports
  const [webrouterPort, websocketerPort] = this.getAvailablePorts()
  this.projectAppConfig.unnameWebrouterPort = webrouterPort
  this.projectAppConfig.unnameWebsocketerPort = websocketerPort
  this.projectAppConfig.stagingWebrouterPort = webrouterPort
  this.projectAppConfig.stagingWebsocketerPort = websocketerPort
  this.projectAppConfig.prodWebrouterPort = webrouterPort
  this.projectAppConfig.prodWebsocketerPort = websocketerPort
  // like app version
  this.projectAppConfig.version = this.appPackage.version
  // set maybe the python command
  if (fs.existsSync(this.webrouterRequirementsDir) || fs.existsSync(this.websocketerRequirementsDir)) {
    if (typeof this.projectAppConfig.python === 'undefined') {
      this.projectAppConfig.python = childProcess.execSync('which python').toString('utf-8').trim()
    }
  }
  // write
  fs.writeFileSync(this.projectPackageDir, JSON.stringify(this.projectPackage, null, 2))
}

module.exports.getCreateVenvCommand = function () {
  return `cd ${this.projectName} && virtualenv -p ${this.projectAppConfig.python} venv`
}

module.exports.createVenv = function () {
  const command = this.getCreateVenvCommand()
  this.consoleInfo('... Installing a python venv for our backend')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

module.exports.create = function () {
  // copy the boilerplate
  if (typeof this.program.name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command')
    return
  }
  this.consoleInfo(`wait a second... We create your ${this.program.name} project !`)
  this.projectDir = path.join(process.cwd(), this.program.name)
  if (fs.existsSync(this.projectDir)) {
    this.consoleWarn(`There is already a ${this.program.name} here...`)
    return
  }
  const command = this.getCopyTemplateCommand()
  console.log(childProcess.execSync(command).toString('utf-8'))
  this.projectPackageDir = path.join(this.projectDir, 'package.json')
  this.projectPackage = JSON.parse(fs.readFileSync(this.projectPackageDir))
  this.projectAppConfig = this.projectPackage[this.appName]
  this.backendDir = path.join(this.projectDir, 'backend')
  this.backendConfigDir = path.join(this.backendDir, 'config')
  this.webrouterRequirementsDir = path.join(this.backendConfigDir, 'webrouter_requirements.txt')
  this.websocketerRequirementsDir = path.join(this.backendConfigDir, 'websocketer_requirements.txt')
  // update the package with some specific attributes like name
  this.createPackage()
  // set backend end
  this.setBackendEnvironment()
  // replace
  this.specify()
  // create a constants.json if not
  if (fs.existsSync(this.backendConfigDir)) {
    if (!fs.existsSync(this.backendConstantsDir)) {
      fs.writeFileSync(this.backendConstantsDir, '{}')
    }
  }
  // maybe create a venv python
  if (fs.existsSync(this.webrouterRequirementsDir) || fs.existsSync(this.websocketerRequirementsDir)) {
    this.createVenv()
  }
  // install
  this.install()
  // console
  this.consoleInfo(`Your ${this.projectName} was successfully created, go inside with \'cd ${this.projectName}\' !`)
}

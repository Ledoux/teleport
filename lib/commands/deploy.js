'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUsedPorts = getUsedPorts;
exports.checkPort = checkPort;
exports.getAvailablePorts = getAvailablePorts;
exports.getBuildDockerCommand = getBuildDockerCommand;
exports.buildDocker = buildDocker;
exports.getPushDockerCommand = getPushDockerCommand;
exports.pushDocker = pushDocker;
exports.getRegisterDockerCommand = getRegisterDockerCommand;
exports.registerDocker = registerDocker;
exports.getRestartDockerCommand = getRestartDockerCommand;
exports.restartDocker = restartDocker;
exports.deploy = deploy;
var childProcess = require('child_process');

var _require = require('../utils'),
    toTitleCase = _require.toTitleCase;

function getUsedPorts() {
  this.checkWeb();
  var command = 'python ' + this.appPythonBinDir + ' ports --server ' + this.projectServerType.serverSubDomain;
  var rep = childProcess.execSync(command).toString('utf-8');
  var ports = JSON.parse('[' + rep.split('[').slice(-1)[0]);
  return ports;
}

function checkPort() {
  if (typeof this.usedPorts === 'undefined') {
    this.usedPorts = this.getUsedPorts();
  }
  // const server = this.projectConfig.serversByName[this.program.server]
}

function getAvailablePorts() {
  this.checkWeb();
  var command = 'python ' + this.appPythonBinDir + ' ports --filter available --server ' + this.projectServerType.serverSubDomain;
  var rep = childProcess.execSync(command).toString('utf-8');
  var ports = JSON.parse('[' + rep.split('[').slice(-1)[0]);
  return ports;
}

function getBuildDockerCommand(config) {
  this.checkProject();
  var backend = this.backend,
      project = this.project,
      program = this.program;

  if (typeof config === 'undefined') {
    config = {};
  }
  config = Object.assign({
    isBase: false,
    server: 'webrouter'
  }, config);
  var serverName = typeof this.program.server === 'undefined' ? config.server : program.server;
  var dir = config.isBase ? this.webrouterBaseImageDir : backend.dir;
  var type = program.type === 'localhost' ? 'staging' : this.program.type;
  var imageName = config.isBase ? this[serverName + 'BaseImage'] : this['' + type + toTitleCase(serverName) + 'Image'];
  var cache = program.cache === 'false' ? '--no-cache' : config.isNoCache ? '--no-cache' : '';
  var file = config.isBase ? '' : '-f ' + type + '_' + serverName + '_Dockerfile';
  var socket = this.buildPushSocket;
  return ['cd ' + dir, 'docker ' + socket + ' build ' + file + ' -t ' + imageName + ' ' + cache + ' .', 'cd ' + project.dir].join(' && ');
}

function buildDocker() {
  this.checkWeb();
  this.checkPort();
  var command = this.getBuildDockerCommand();
  console.log('Ok we build your docker image... can take a little of time ...\n    ' + command);
  console.log(childProcess.execSync(command).toString('utf-8'));
}

function getPushDockerCommand(config) {
  this.checkProject();
  if (typeof config === 'undefined') {
    config = {};
  }
  config = Object.assign({
    isBase: false,
    server: 'webrouter'
  }, config);
  var serverName = typeof this.program.server === 'undefined' ? config.server : this.program.server;
  var dir = config.isBase ? this[config.server + 'BaseImageDir'] : this.backendDir;
  var type = this.program.type === 'localhost' ? 'staging' : this.program.type;
  var imageName = config.isBase ? this[serverName + 'BaseImage'] : this['' + type + toTitleCase(serverName) + 'Image'];
  var socket = this.buildPushSocket;
  return ['cd ' + dir, 'docker ' + socket + ' push ' + imageName, 'cd ' + this.projectDir].join(' && ');
}

function pushDocker() {
  this.checkWeb();
  this.checkPort();
  var command = this.getPushDockerCommand();
  console.log('Ok we push your docker image... can take a little of time ...\n    ' + command);
  console.log(childProcess.execSync(command).toString('utf-8'));
}

function getRegisterDockerCommand(config) {
  this.checkProject();
  if (typeof config === 'undefined') {
    config = {};
  }
  config = Object.assign({
    server: 'webrouter'
  }, config);
  var serverName = typeof this.program.server === 'undefined' ? config.server : this.program.server;
  var type = this.program.type === 'localhost' ? 'staging' : this.program.type;
  var serviceYamlPath = this.backendConfigDir + '/' + type + '_' + serverName + '_service.yaml';
  var controllerYamlPath = this.backendConfigDir + '/' + type + '_' + serverName + '_controller.yaml';
  return ['python ' + this.appPythonBinDir + ' service register ' + serviceYamlPath, 'python ' + this.appPythonBinDir + ' service register ' + controllerYamlPath, 'cd ' + this.projectDir].join(' && ');
}

function registerDocker() {
  this.checkWeb();
  this.checkPort();
  var command = this.getRegisterDockerCommand();
  console.log('Ok we register your docker image... can take a little of time ...\n    ' + command);
  console.log(childProcess.execSync(command).toString('utf-8'));
}

function getRestartDockerCommand(config) {
  this.checkProject();
  if (typeof config === 'undefined') {
    config = {};
  }
  config = Object.assign({
    isBase: false,
    server: 'webrouter'
  }, config);
  var serverName = typeof this.program.server === 'undefined' ? config.server : this.program.server;
  var titleWebserverName = toTitleCase(serverName);
  var dir = this.backendDir;
  var type = this.program.type === 'localhost' ? 'staging' : this.program.type;
  var tag = this['' + type + titleWebserverName + 'Tag'];
  var imageName = config.isBase ? this[serverName + 'BaseImage'] : this['' + type + titleWebserverName + 'Image'];
  var url = this['' + type + titleWebserverName + 'Url'];
  if (type === 'unname') {
    tag = '--name ' + tag;
    var portNumber = this['' + type + titleWebserverName + 'Port'];
    var port = '-p ' + portNumber + ':' + portNumber;
    var socket = this[type + 'Socket'];
    var command = 'docker ' + socket + ' run -d ' + port + ' ' + tag + ' ' + imageName;
  } else {
    command = 'python ' + this.appPythonBinDir + ' service restart ' + tag;
  }
  return ['cd ' + dir, command, 'echo Your service is available here : ' + url, 'cd ' + this.projectDir].join(' && ');
}

function restartDocker() {
  this.checkWeb();
  this.checkPort();
  var command = this.getRestartDockerCommand();
  console.log('Ok we restart your docker container... can take a little of time ...\n    ' + command);
  console.log(childProcess.execSync(command).toString('utf-8'));
  console.log('If you have some trouble, go to ' + this.appConfig.kubernetesUrl);
}

function deploy() {
  this.buildDocker();
  this.pushDocker();
  this.registerDocker();
  this.restartDocker();
}
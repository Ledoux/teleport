'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deploy = deploy;
exports.deployBaseServers = deployBaseServers;
exports.deployServerInNewTab = deployServerInNewTab;
exports.deployServers = deployServers;
exports.deployServer = deployServer;
exports.getUsedPorts = getUsedPorts;
exports.checkPort = checkPort;
exports.getBuildDockerCommand = getBuildDockerCommand;
exports.buildDocker = buildDocker;
exports.getPushDockerCommand = getPushDockerCommand;
exports.pushDocker = pushDocker;
exports.getRegisterDockerCommand = getRegisterDockerCommand;
exports.registerDocker = registerDocker;
exports.getRestartDockerCommand = getRestartDockerCommand;
exports.restartDocker = restartDocker;
exports.getDnsDockerCommand = getDnsDockerCommand;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function deploy() {
  var program = this.program;
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here

  if (program.type === 'localhost') {
    program.type = 'staging';
  }
  if (program.server && program.type) {
    this.deployServer();
  } else {
    this.deployServers();
  }
}

function deployBaseServers() {
  var program = this.program;

  program.method = 'deployServer';
  program.methods = null;
  this.setTypeEnvironment();
  this.mapInServers();
}

function deployServerInNewTab() {
  var app = this.app,
      program = this.program,
      server = this.server,
      type = this.type;

  var command = app.ttabDir + ' tpt -d --server ' + server.name + ' --type ' + type.name + ' --cache ' + program.cache;
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function deployServers() {
  var program = this.program;

  program.method = 'deployServer';
  if (program.user === 'me') {
    program.method = program.method + 'InNewTab';
  }
  program.methods = null;
  this.setTypeEnvironment();
  this.mapInServers();
}

function deployServer() {
  var program = this.program;

  this.buildDocker();
  this.pushDocker();
  if (program.image !== 'base') {
    this.registerDocker();
    this.restartDocker();
  }
}

function getUsedPorts() {
  this.checkWeb();
  var app = this.app,
      run = this.run;

  if (!run) return;
  var command = 'python ' + app.pythonDir + ' ports --docker ' + run.host;
  var rep = _child_process2.default.execSync(command).toString('utf-8');
  var ports = JSON.parse('[' + rep.split('[').slice(-1)[0]);
  return ports;
}

function checkPort() {
  if (typeof this.usedPorts === 'undefined') {
    this.usedPorts = this.getUsedPorts();
  }
}

function getBuildDockerCommand(config) {
  this.checkProject();
  var backend = this.backend,
      project = this.project,
      program = this.program,
      run = this.run,
      server = this.server,
      type = this.type;

  var fileName = 'Dockerfile';
  if (program.image) {
    fileName = program.image + '_' + fileName;
  }
  if (type) {
    fileName = type.name + '_' + fileName;
  }
  var imageName = program.image ? server[program.image + 'Image'] : run.image;
  var cache = program.cache === 'true' ? '' : '--no-cache';
  return ['cd ' + server.dir, 'docker ' + backend.buildPushSocket + ' build -f ' + fileName + ' -t ' + imageName + ' ' + cache + ' .', 'cd ' + project.dir].join(' && ');
}

function buildDocker() {
  this.checkWeb();
  this.checkPort();
  var program = this.program,
      server = this.server,
      type = this.type;

  var command = this.getBuildDockerCommand();
  this.consoleInfo('Ok we build your docker image of ' + type.name + ' ' + (program.image ? program.image : '') + ' ' + server.name + '...\n    can take a little of time...');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getPushDockerCommand(config) {
  this.checkProject();
  var backend = this.backend,
      project = this.project,
      program = this.program,
      run = this.run,
      server = this.server;

  var imageName = void 0;
  if (program.image) {
    imageName = server[program.image + 'Image'];
  } else if (run) {
    imageName = run.image;
  }
  var command = ['cd ' + server.dir, 'docker ' + backend.buildPushSocket + ' push ' + imageName, 'cd ' + project.dir].join(' && ');
  return command;
}

function pushDocker() {
  this.checkWeb();
  // this.checkPort()
  var command = this.getPushDockerCommand();
  this.consoleInfo('Ok we push your docker image...\n    can take a little of time...');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getRegisterDockerCommand(config) {
  this.checkProject();
  var app = this.app,
      project = this.project,
      run = this.run,
      server = this.server,
      type = this.type;

  if (!run) return;
  var serviceYamlPath = server.configDir + '/' + type.name + '_service.yaml';
  var controllerYamlPath = server.configDir + '/' + type.name + '_controller.yaml';
  return ['python ' + app.pythonDir + ' register ' + serviceYamlPath, 'python ' + app.pythonDir + ' register ' + controllerYamlPath, 'cd ' + project.dir].join(' && ');
}

function registerDocker() {
  this.checkWeb();
  this.checkPort();
  var command = this.getRegisterDockerCommand();
  this.consoleInfo('Ok we register your docker image...\n    can take a little of time...');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getRestartDockerCommand(config) {
  this.checkProject();
  var app = this.app,
      project = this.project,
      server = this.server,
      type = this.type,
      run = this.run;

  var command = void 0;
  if (type.name === 'unname') {
    var tag = '--name ' + run.tag;
    var port = '-p ' + run.port + ':' + run.port;
    command = 'docker ' + type.socket + ' run -d ' + port + ' ' + tag + ' ' + run.image;
  } else {
    command = 'python ' + app.pythonDir + ' restart ' + run.tag;
  }
  return ['cd ' + server.dir, command, 'echo Your service is available here : ' + run.url, 'cd ' + project.dir].join(' && ');
}

function restartDocker() {
  var project = this.project;

  this.checkWeb();
  this.checkPort();
  var command = this.getRestartDockerCommand();
  this.consoleInfo('Ok we restart your docker container...\n    can take a little of time...');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  this.consoleInfo('If you have some trouble, go to ' + project.config.backend.kubernetesUrl);
}

function getDnsDockerCommand() {
  var run = this.run;

  return 'sky dns add ' + run.dockerHost + ' ' + run.dns + ' snips.ai';
}
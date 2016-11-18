'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deploy = deploy;
exports.getUsedPorts = getUsedPorts;
exports.checkPort = checkPort;
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
  var command = 'tpt -e --script deploy --type ' + program.type + ' --servers all';
  if (program.user === 'me') {
    command = command + ' --ttab true';
  }
  _child_process2.default.execSync(command);
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
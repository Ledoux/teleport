'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.install = install;
exports.installProject = installProject;
exports.installBackend = installBackend;
exports.installScript = installScript;
exports.installKubernetes = installKubernetes;
exports.getInstallKubernetesCommand = getInstallKubernetesCommand;
exports.installDocker = installDocker;
exports.installAppRequirements = installAppRequirements;
exports.installServers = installServers;
exports.installServer = installServer;
exports.installSecrets = installSecrets;
exports.installSecret = installSecret;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function install() {
  this.getLevelMethod('install')();
  this.consoleInfo('install was successful !');
}

function installProject() {
  var backend = this.backend,
      name = this.project.package.name;

  this.consoleInfo('Let\'s install this ' + name + ' project !');
  if (backend) {
    this.installBackend();
  }
  this.consoleInfo('project install done !');
}

function installBackend() {
  this.installScript();
  this.installKubernetes();
  this.installAppRequirements();
  this.installSecrets();
  this.write(this.project);
  this.replace();
  this.installServers();
}

function installScript() {
  var app = this.app,
      program = this.program;

  var command = 'cd ' + this.project.dir + ' && sh bin/install.sh';
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleInfo('Let\'s install the project');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installKubernetes() {
  this.consoleInfo('Let\'s install kubernetes configs');
  var command = this.getInstallKubernetesCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  this.consoleInfo('kubernetes configs are installed !');
}

function getInstallKubernetesCommand() {
  this.checkProject();
  var kubernetes = this.kubernetes,
      dir = this.project.dir;

  if (typeof kubernetes === 'undefined') {
    this.consoleError('You must define a kubernetes config');
  }
  var commands = ['cd ' + _path2.default.join(dir, 'bin')];
  commands.push('kubectl config set-cluster master --server=http://' + kubernetes.host + ':' + kubernetes.port);
  commands.push('kubectl config set-context master --cluster=master');
  commands.push('kubectl config use-context master');
  commands.push('kubectl get nodes');
  return commands.join(' && ');
}

function installDocker() {
  var docker = this.docker;

  var dockerVersionDigit = parseInt(_child_process2.default.execSync('docker version --format \'{{.Client.Version}}\'').toString('utf-8').replace(/(\.+)/g, ''));
  var projectDockerVersion = docker.version;
  var projectDockerVersionDigit = parseInt(projectDockerVersion.replace(/(\.+)/g, ''));
  if (dockerVersionDigit > projectDockerVersionDigit) {
    var dockerFile = 'docker-' + project.dockerVersion;
    var command = ['exec wget https://get.docker.com/builds/Darwin/x86_64/' + projectDockerVersion, 'cp ' + dockerFile + ' $(which docker)', 'rm ' + dockerFile].join(' && ');
    this.consoleInfo('Let\'s install a good docker version, that one : ' + projectDockerVersion);
    this.consoleLog(command);
    _child_process2.default.execSync(command);
  }
}

function installAppRequirements() {
  var app = this.app,
      program = this.program;

  this.consoleInfo('Let \'s install in the venv the tpt requirements');
  var command = 'pip install ' + app.requirements.join(' ');
  if (app.venvDir) {
    command = 'source ' + app.venvDir + '/bin/activate && ' + command;
  }
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installServers() {
  var program = this.program;

  program.image = undefined;
  program.method = 'installServer';
  program.methods = null;
  program.type = 'localhost';
  this.setTypeEnvironment();
  this.mapInServers();
}

function installServer() {
  var app = this.app,
      program = this.program,
      server = this.server;

  var commands = [];
  var fileName = 'install.sh';
  fileName = 'localhost_' + fileName;
  var fileDir = _path2.default.join(server.dir, 'scripts', fileName);
  if (!_fs2.default.existsSync(fileDir)) {
    fileName = 'install.sh';
  }
  this.consoleInfo('Let\'s launch the ' + fileName + ' needed in the docker server... it can\'t take a long time');
  // for now for settings like Xcode8 with ElCaptain uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  commands.push('cd ' + server.dir);
  commands.push(program.permission + ' sh scripts/' + fileName);
  var command = commands.join(' && ');
  if (app.venvDir) {
    command = 'source ' + app.venvDir + '/bin/activate && ' + command;
  }
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installSecrets() {
  var program = this.program;

  program.base = null;
  program.method = 'installSecret';
  program.methods = null;
  this.mapInServers();
}

function installSecret() {
  var server = this.server;
  // configure maybe an empty secret

  var secretDir = _path2.default.join(server.dir, 'config/secret.json');
  if (!_fs2.default.existsSync(secretDir)) {
    _fs2.default.writeFileSync(secretDir, '{}');
  }
}
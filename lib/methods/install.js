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
exports.getInstallVenvCommand = getInstallVenvCommand;
exports.installPythonVenv = installPythonVenv;
exports.installAppRequirements = installAppRequirements;
exports.installServer = installServer;
exports.installPorts = installPorts;
exports.installSecrets = installSecrets;
exports.installSecret = installSecret;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

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
  this.installPythonVenv();
  this.installAppRequirements();
  this.installSecrets();
  this.installPorts();
  this.write(this.project);
  this.replace();
  this.installServers();
}

function installScript() {
  var command = 'cd ' + this.project.dir + ' && sh bin/install.sh';
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

function getInstallVenvCommand() {
  this.checkProject();
  var project = this.project,
      program = this.program;

  var option = '';
  if (program.lib === 'global') {
    option = '--system-site-packages';
  }
  var venvDir = _path2.default.join(project.dir, project.config.venv, '../');
  return 'cd ' + venvDir + ' && virtualenv -p ' + project.config.python + ' venv ' + option;
}

function installPythonVenv() {
  var project = this.project,
      program = this.program;

  if (program.lib === 'global') {
    return;
  }
  // check if a path to a venv was already set
  if (project.config.venv && _fs2.default.existsSync(project.config.venv)) {
    this.consoleInfo('There is already a venv here ' + project.config.venv);
    return;
  }
  // just maybe check if there is one venv on the parent dir
  var parentVenvDir = _path2.default.join(project.dir, '../venv');
  if (_fs2.default.existsSync(parentVenvDir)) {
    this.consoleInfo('There is a venv here on the parent folder');
    project.config.venv = '../venv';
    return;
  }
  // either create one at the level of the project
  project.config.venv = './venv';
  this.consoleInfo('...Installing a python venv for our backend');
  var command = this.getInstallVenvCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installAppRequirements() {
  var app = this.app,
      project = this.project;

  this.consoleInfo('Let \'s install in the venv the tpt requirements');
  var command = 'source ' + project.config.venv + '/bin/activate && pip install ' + app.requirements.join(' ');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installServer() {
  var app = this.app,
      program = this.program,
      server = this.server;

  var commands = [];
  var fileName = 'install.sh';
  if (program.image && typeof program.image !== 'undefined') {
    fileName = program.image + '_' + fileName;
  }
  fileName = 'localhost_' + fileName;
  this.consoleInfo('Let\'s launch the ' + fileName + ' needed in the docker server... it can\'t take a long time');
  // for now for settings like Xcode8 with ElCaptai uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  commands.push('cd ' + server.dir);
  commands.push(program.permission + ' sh scripts/' + fileName);
  var command = commands.join(' && ');
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installPorts() {
  var _this = this;

  this.checkProject();
  this.checkWeb();
  var _project = this.project,
      config = _project.config,
      dir = _project.dir;

  this.availablePortsBySubDomain = {};
  (0, _lodash.values)(config.typesByName).forEach(function (type) {
    if (type.subDomain) {
      _this.availablePortsBySubDomain[type.subDomain] = _this.getAvailablePorts(type.subDomain);
    }
  });
  if (config.backend && config.backend.serversByName) {
    Object.keys(config.backend.serversByName).forEach(function (serverName, index) {
      var server = config.backend.serversByName[serverName];
      Object.keys(config.typesByName).forEach(function (typeName) {
        var run = server.runsByTypeName[typeName];
        if (typeof run === 'undefined') {
          run = server.runsByTypeName[typeName] = {};
        }
        var subDomain = run.subDomain || config.typesByName[typeName].subDomain;
        if (typeof subDomain === 'undefined') {
          return;
        }
        if (_this.availablePortsBySubDomain[subDomain]) {
          var availablePorts = _this.availablePortsBySubDomain[subDomain];
          if (availablePorts.length < 1) {
            _this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.');
            process.exit();
          }
          run.port = availablePorts[0].toString();
          _this.availablePortsBySubDomain[subDomain] = availablePorts.slice(1);
        }
      });
    });
  }
  this.writeConfig(dir, config);
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
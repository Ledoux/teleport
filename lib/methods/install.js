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
exports.installBasePlaceholderFiles = installBasePlaceholderFiles;
exports.installBaseServers = installBaseServers;
exports.installServer = installServer;
exports.installPorts = installPorts;
exports.installPlaceholderFiles = installPlaceholderFiles;
exports.installPlaceholderFile = installPlaceholderFile;
exports.installServers = installServers;
exports.installSecrets = installSecrets;
exports.installSecret = installSecret;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var notLocalhostPlaceholderFiles = ['controller.yaml', 'Dockerfile', 'service.yaml'];

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
  // this.installBasePlaceholderFiles()
  // this.installBaseServers()
  this.setAllTypesAndServersEnvironment();
  this.installPlaceholderFiles();
  this.installServers();
  this.installSecrets();
  this.installPorts();
  this.write(this.project);
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
  var _project = this.project,
      masterHost = _project.config.backend.masterHost,
      dir = _project.dir;

  if (typeof masterHost !== 'string') {
    this.consoleError('You must define a masterHost for kubectl');
  }
  var commands = ['cd ' + _path2.default.join(dir, 'bin')];
  commands.push('kubectl config set-cluster master --server=http://' + masterHost + ':8080');
  commands.push('kubectl config set-context master --cluster=master');
  commands.push('kubectl config use-context master');
  commands.push('kubectl get nodes');
  return commands.join(' && ');
}

function installDocker() {
  var project = this.project;

  var dockerVersionDigit = parseInt(_child_process2.default.execSync('docker version --format \'{{.Client.Version}}\'').toString('utf-8').replace(/(\.+)/g, ''));
  var projectDockerVersion = project.config.backend.dockerVersion;
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
  return 'cd ' + project.dir + ' && virtualenv -p ' + project.config.python + ' venv ' + option;
}

function installPythonVenv() {
  var project = this.project,
      program = this.program;

  if (program.lib === 'global') {
    return;
  }
  if (project.config.venv && !_fs2.default.exists(project.config.venv)) {
    this.consoleInfo('There is already a venv here ' + project.config.venv);
    return;
  }
  this.consoleInfo('...Installing a python venv for our backend');
  var command = this.getInstallVenvCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  project.config.venv = '../../venv';
}

function installBasePlaceholderFiles() {
  var _this = this;

  var program = this.program;

  program.image = 'base';
  program.method = null;
  program.methods = ['install.sh'].map(function (file) {
    return {
      folder: 'scripts',
      file: file
    };
  }).map(function (newProgram) {
    return function () {
      Object.assign(program, newProgram);
      _this.installPlaceholderFile();
    };
  });
  this.mapInTypesAndServers();
}

function installBaseServers() {
  var program = this.program;

  program.image = 'base';
  program.method = 'installServer';
  program.methods = null;
  program.type = 'localhost';
  this.setTypeEnvironment();
  this.mapInServers();
}

function installServer() {
  var program = this.program,
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
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installPorts() {
  var _this2 = this;

  this.checkProject();
  this.checkWeb();
  var _project2 = this.project,
      config = _project2.config,
      dir = _project2.dir;

  this.availablePortsBySubDomain = {};
  (0, _lodash.values)(config.typesByName).forEach(function (type) {
    if (type.subDomain) {
      _this2.availablePortsBySubDomain[type.subDomain] = _this2.getAvailablePorts(type.subDomain);
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
        if (_this2.availablePortsBySubDomain[subDomain]) {
          var availablePorts = _this2.availablePortsBySubDomain[subDomain];
          if (availablePorts.length < 1) {
            _this2.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.');
            process.exit();
          }
          run.port = availablePorts[0].toString();
          _this2.availablePortsBySubDomain[subDomain] = availablePorts.slice(1);
        }
      });
    });
  }
  this.writeConfig(dir, config);
}

function installPlaceholderFiles() {
  var _this3 = this;

  var program = this.program;

  this.setAllTypesAndServersEnvironment();
  program.image = undefined;
  program.method = null;
  program.methods = ['service.yaml', 'controller.yaml', 'client_secret.json', 'uwsgi.ini', 'guwsgi.ini'].map(function (file) {
    return {
      folder: 'config',
      file: file
    };
  }).concat(['install.sh', 'start.sh'].map(function (file) {
    return {
      folder: 'scripts',
      file: file
    };
  })).concat(['Dockerfile'].map(function (file) {
    return {
      folder: 'server',
      file: file
    };
  })).map(function (newProgram) {
    return function () {
      Object.assign(program, newProgram);
      _this3.installPlaceholderFile();
    };
  });
  this.mapInTypesAndServers();
}

var templatePrefix = '_p_';

function installPlaceholderFile() {
  this.checkProject();
  var backend = this.backend,
      program = this.program,
      run = this.run,
      server = this.server,
      type = this.type;
  // check

  if (!backend || !run || !server || !type || type.name === 'localhost' && notLocalhostPlaceholderFiles.includes(program.file)) {
    return;
  }
  // set the file name
  var installedFileName = program.file;
  var typePrefix = void 0;
  if (program.image && typeof program.image !== 'undefined') {
    installedFileName = program.image + '_' + installedFileName;
  }
  if (type) {
    typePrefix = type.name + '_';
    installedFileName = '' + typePrefix + installedFileName;
  }
  // look first if there is no specific <type>_<image>_<script> template
  var templateFile = void 0;
  var templateFileName = installedFileName;
  var templateFolderDir = program.folder === 'server' ? server.templateServerDir : _path2.default.join(server.templateServerDir, program.folder);
  templateFileName = '' + templatePrefix + templateFileName;
  var templateFileDir = _path2.default.join(templateFolderDir, templateFileName);
  if (_fs2.default.existsSync(templateFileDir)) {
    templateFile = _fs2.default.readFileSync(templateFileDir, 'utf-8');
  } else {
    // remove the type prefix then to find a general <image>_<script> template
    templateFileName = templateFileName.slice(templatePrefix.length + typePrefix.length);
    templateFileName = '' + templatePrefix + templateFileName;
    templateFileDir = _path2.default.join(templateFolderDir, templateFileName);
    if (_fs2.default.existsSync(templateFileDir)) {
      templateFile = _fs2.default.readFileSync(templateFileDir, 'utf-8');
    } else {
      return;
    }
  }
  var installedFolderDir = program.folder === 'server' ? server.dir : _path2.default.join(server.dir, program.folder);
  var installedFileDir = _path2.default.join(installedFolderDir, installedFileName);
  // prepare the dockerExtraConfig
  var extraConfig = Object.assign({
    'DOCKER_HOST': run.host,
    'PORT': run.port,
    'SITE_NAME': backend.siteName,
    'TYPE': type.name,
    'URL': run.url,
    'WEB': 'on'
  }, backend.dockerEnv, server.dockerEnv);
  this.dockerExtraConfig = Object.keys(extraConfig).map(function (key) {
    return 'ENV ' + key + ' ' + extraConfig[key];
  }).join('\n');
  this.manageExtraConfig = Object.keys(extraConfig).map(function (key) {
    return 'export ' + key + '=' + extraConfig[key];
  }).join(' && ');
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = this.manageExtraConfig + ' &&';
  }
  // info
  this.consoleInfo('Let\'s install this placeholder file ' + installedFileDir);
  // replace
  _fs2.default.writeFileSync(installedFileDir, (0, _utils.formatString)(templateFile, this));
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
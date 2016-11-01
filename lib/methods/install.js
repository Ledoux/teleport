'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.install = install;
exports.installScope = installScope;
exports.getInstallKubernetesCommand = getInstallKubernetesCommand;
exports.installKubernetes = installKubernetes;
exports.installInApp = installInApp;
exports.installProject = installProject;
exports.installBackend = installBackend;
exports.getInstallVenvCommand = getInstallVenvCommand;
exports.installPythonVenv = installPythonVenv;
exports.installAppPythonLib = installAppPythonLib;
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

function installScope() {
  var name = this.scope.package.name;

  this.consoleInfo('Let\'s install this ' + name + ' scope !');
  this.installKubernetes();
  this.installInApp();
  this.consoleInfo('scope install done !');
}

function getInstallKubernetesCommand() {
  var app = this.app,
      scope = this.scope;

  var commands = ['cd ' + app.binDir];
  commands.push('kubectl config set-cluster master --server=http://' + scope.config.backend.masterHost + ':8080');
  commands.push('kubectl config set-context master --cluster=master');
  commands.push('kubectl config use-context master');
  commands.push('kubectl get nodes');
  return commands.join(' && ');
}

function installKubernetes() {
  this.checkScope();
  this.consoleInfo('Let\'s install kubernetes configs');
  var command = this.getInstallKubernetesCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  console.log('kubernetes configs are installed !');
}

function installInApp() {
  this.checkScope();
  var app = this.app,
      scope = this.scope;
  // register maybe

  if (typeof app.config.scopesByName[scope.package.name] === 'undefined') {
    app.config.scopesByName[scope.package.name] = {
      dir: scope.dir
    };
  }
  // set current
  app.config.currentScopeName = scope.package.name;
  // write
  this.writeConfig(app.dir, app.config);
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
  this.installPythonVenv();
  this.installAppPythonLib();
  this.installBasePlaceholderFiles();
  this.installBaseServers();
  this.installPorts();
  this.setAllTypesAndServersEnvironment();
  this.installPlaceholderFiles();
  this.installServers();
  this.installSecrets();
  this.write(this.project);
}

function getInstallVenvCommand() {
  this.checkProject();
  var project = this.project;

  return 'cd ' + project.dir + ' && virtualenv -p ' + project.config.python + ' venv';
}

function installPythonVenv() {
  var program = this.program,
      project = this.project;

  if (typeof project.config.python === 'undefined' || program.venv === 'false') {
    return;
  }
  this.consoleInfo('... Installing a python venv for our backend');
  var command = this.getInstallVenvCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installAppPythonLib() {
  this.setActivatedPythonVenv();
  var program = this.program,
      project = this.project;

  if (typeof project.config.python === 'undefined' || program.venv === 'false') {
    return;
  }
  this.consoleInfo('... Installing the python lib necessary for the teleport app');
  var command = 'cd ' + project.dir + ' && ' + project.config.pip + ' install -r requirements.txt';
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installBasePlaceholderFiles() {
  var _this = this;

  var program = this.program;

  program.image = 'base';
  program.method = null;
  program.methods = [{
    folder: 'scripts',
    file: 'install.sh'
  }, {
    folder: 'server',
    file: 'Dockerfile'
  }].map(function (newProgram) {
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

  if (program.pip === 'false') return;
  this.setActivatedPythonVenv();
  // for some reason, some python lib requires sudo install even if we are in venv mode
  var fileName = 'install.sh';
  if (program.image && typeof program.image !== 'undefined') {
    fileName = program.image + '_' + fileName;
  }
  fileName = 'localhost_' + fileName;
  this.consoleInfo('Let\'s launch the ' + fileName + ' needed in the docker server... it can\'t take a long time');
  var installCommand = 'cd ' + server.dir + ' && sudo sh scripts/' + fileName;
  this.consoleLog(installCommand);
  console.log(_child_process2.default.execSync(installCommand).toString('utf-8'));
}

function installPorts() {
  var _this2 = this;

  this.checkProject();
  this.checkWeb();
  this.availablePortsByDockerName = {};
  this.setAllTypesAndServersEnvironment();
  Object.keys(this.availablePortsByDockerName).forEach(function (dockerName) {
    _this2.availablePortsByDockerName[dockerName] = _this2.getAvailablePorts(dockerName);
  });
  var backend = this.backend;

  Object.keys(backend.serversByName).forEach(function (serverName, index) {
    var server = backend.serversByName[serverName];
    (0, _lodash.values)(server.runsByTypeName).forEach(function (run) {
      if (_this2.availablePortsByDockerName[run.dockerName]) {
        var availablePorts = _this2.availablePortsByDockerName[run.dockerName];
        if (availablePorts.length < 1) {
          _this2.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.');
          process.exit();
        }
        run.port = availablePorts[0].toString();
        _this2.availablePortsByDockerName[run.dockerName] = availablePorts.slice(1);
      }
    });
  });
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
  var templateFolderDirKey = 'scope' + (0, _utils.toTitleCase)(program.folder) + 'Dir';
  var templateFolderDir = server[templateFolderDirKey];
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
  var installedFolderDirKey = program.folder === 'server' ? 'dir' : program.folder + 'Dir';
  var installedFolderDir = server[installedFolderDirKey];
  var installedFileDir = _path2.default.join(installedFolderDir, installedFileName);
  // prepare the dockerExtraConfig
  var extraConfig = Object.assign({
    'DOCKER_HOST': run.host,
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
  // add maybe an empty secret

  var secretDir = _path2.default.join(server.configDir, 'secret.json');
  if (!_fs2.default.existsSync(secretDir)) {
    _fs2.default.writeFileSync(secretDir, '{}');
  }
}
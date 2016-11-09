'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setAppEnvironment = setAppEnvironment;
exports.setScopeEnvironment = setScopeEnvironment;
exports.setProjectEnvironment = setProjectEnvironment;
exports.setTypeEnvironment = setTypeEnvironment;
exports.setBackendEnvironment = setBackendEnvironment;
exports.setProviderEnvironment = setProviderEnvironment;
exports.setServerEnvironment = setServerEnvironment;
exports.setRunEnvironment = setRunEnvironment;
exports.setAllTypesAndServersEnvironment = setAllTypesAndServersEnvironment;
exports.setActivatedPythonVenv = setActivatedPythonVenv;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setAppEnvironment() {
  var app = this.app;

  app.dir = _path2.default.join(__dirname, '../../');
  app.binDir = _path2.default.join(app.dir, 'bin');
  app.nodeModulesDir = _path2.default.join(app.dir, 'node_modules');
  app.utilsDir = _path2.default.join(app.dir, 'utils');
  app.defaultScopeDir = _path2.default.join(app.dir, 'default');
  app.pythonBinDir = _path2.default.join(app.binDir, 'index.py');
  app.packageDir = _path2.default.join(app.dir, 'package.json');
  app.package = (0, _utils.getPackage)(app.dir);
  app.configFile = '.' + app.package.name.split('.js')[0] + '.json';
  app.configDir = _path2.default.join(app.dir, app.configFile);
  app.config = this.getConfig(app.dir);
  app.defaultDir = _path2.default.join(app.dir, 'default');
  app.config.scopesByName.default = {
    dir: app.defaultDir
  };
  app.currentScope = app.config.scopesByName[app.config.currentScopeName];
  this.ttabDir = _path2.default.join(app.nodeModulesDir, 'ttab/bin/ttab');
}

function setScopeEnvironment() {
  var configFile = this.app.configFile,
      scope = this.scope;

  this.read(scope);
  scope.packageDir = _path2.default.join(scope.dir, 'package.json');
  scope.nodeModulesDir = _path2.default.join(scope.dir, 'node_modules');
  scope.templatesDir = _path2.default.join(scope.dir, 'templates');
  scope.configDir = _path2.default.join(scope.dir, configFile);
}

function setProjectEnvironment() {
  var program = this.program,
      project = this.project;

  project.packageDir = _path2.default.join(project.dir, 'package.json');
  project.gitignoreDir = _path2.default.join(project.dir, '.gitignore');
  project.secretDir = _path2.default.join(project.dir, 'secret.json');
  this.read(project);
  this.setTypeEnvironment();
  this.setBackendEnvironment();
  if (typeof project.config.python === 'undefined') {
    project.config.python = _child_process2.default.execSync('which python').toString('utf-8').trim();
  }
  project.config.pip = program.global === 'local' ? _path2.default.join(project.dir, 'venv/bin/pip') : _child_process2.default.execSync('which pip').toString('utf-8').trim();
}

function setTypeEnvironment() {
  var program = this.program,
      _project$config = this.project.config,
      pip = _project$config.pip,
      typesByName = _project$config.typesByName;

  if (typeof program.type !== 'string') {
    this.type = null;
    return;
  }
  var type = this.type = Object.assign({}, typesByName[program.type]);
  type.name = program.type;
  type.pip = type.name === 'localhost' ? pip : 'pip';
}

function setBackendEnvironment() {
  // backend global env
  var project = this.project,
      type = this.type;

  if (typeof project.config.backend === 'undefined') {
    this.backend = null;
    return;
  }
  var backend = this.backend = project.config.backend;
  backend.dir = _path2.default.join(project.dir, 'backend');
  backend.dataDir = _path2.default.join(backend.dir, 'data');
  backend.serversDir = _path2.default.join(backend.dir, 'servers');
  backend.pythonScriptsDir = _path2.default.join(backend.dir, 'scripts');
  backend.dockerEnv = backend.dockerEnv || {};
  backend.buildPushDockerServer = backend.buildPushDockerHost + ':' + backend.dockerPort;
  backend.buildPushSocket = '-H tcp://' + backend.buildPushDockerServer;
  backend.siteName = backend.siteName || project.package.name;
  backend.capitalSiteName = backend.siteName.toUpperCase();
  backend.serverNames = Object.keys(project.config.backend.serversByName);
  // this.serverUrlsByName = {}
  if (type && type.dockerHost) {
    type.dockerServer = type.dockerHost + ':' + backend.dockerPort;
    type.socket = '-H tcp://' + type.dockerServer;
  }
  this.setProviderEnvironment();
  this.setServerEnvironment();
}

function setProviderEnvironment() {
  var backend = this.backend,
      program = this.program;

  if (typeof program.provider !== 'string') {
    this.provider = null;
    return;
  }
  var provider = this.provider = Object.assign({}, backend.providersByName[program.provider]);
  provider.name = program.provider;
  provider.dataDir = _path2.default.join(backend.dataDir, program.provider + '_data');
  provider.startDir = _path2.default.join(provider.dataDir, 'start.sh');
}

function setServerEnvironment() {
  var backend = this.backend,
      program = this.program,
      scope = this.scope;

  if (typeof program.server !== 'string') {
    this.server = null;
    return;
  }
  var server = this.server = Object.assign({}, backend.serversByName[program.server]);
  server.name = program.server;
  server.dir = _path2.default.join(backend.serversDir, server.name);
  server.configDir = _path2.default.join(server.dir, 'config');
  server.requirementsDir = _path2.default.join(server.configDir, 'requirements.txt');
  server.scriptsDir = _path2.default.join(server.dir, 'scripts');
  // server.depBases = this.getDepBases(server)
  server.dockerEnv = server.dockerEnv || {};
  server.isNoCache = false;
  server.baseImage = backend.registryServer + '/' + server.baseTag + ':' + server.baseDockerVersion;
  server.tag = backend.siteName + '-' + server.imageAbbreviation;
  if (typeof server.runsByTypeName === 'undefined') {
    server.runsByTypeName = {};
  }
  server.scopeTemplateDir = _path2.default.join(scope.templatesDir, server.templateName);
  server.scopeBackendDir = _path2.default.join(server.scopeTemplateDir, 'backend');
  server.scopeServersDir = _path2.default.join(server.scopeBackendDir, 'servers');
  server.scopeServerDir = _path2.default.join(server.scopeServersDir, server.name);
  server.scopeConfigDir = _path2.default.join(server.scopeServerDir, 'config');
  server.scopeScriptsDir = _path2.default.join(server.scopeServerDir, 'scripts');
  /*
  if (type) {
    const run = server.runsByTypeName[type.name]
    if (run) {
      this.serverUrlsByName[`${toCapitalRegularCase(server.name)}_URL`] = run.url
    }
  }*/
  this.setRunEnvironment();
}

function setRunEnvironment() {
  var backend = this.backend,
      server = this.server,
      type = this.type;

  if (!type) {
    this.run = null;
    return;
  }
  var run = this.run = Object.assign({}, type, server.runsByTypeName[type.name]);
  // here we want to mutate the server.runsByTypeName[type.name] to keep the settings
  // that are done here
  server.runsByTypeName[type.name] = run;
  // set the docker image
  if (run.dockerHost) {
    // subDomain
    run.dockerName = run.dockerHost.split('.')[0];
    // init
    if (typeof this.availablePortsByDockerName !== 'undefined') {
      this.availablePortsByDockerName[run.dockerName] = [];
    }
    // special case where we give to the host just the name of the dockerHost
    if (!type.hasDns) {
      run.host = type.dockerHost;
    }
    run.tag = type.name === 'prod' ? server.tag : type.imageAbbreviation + '-' + server.tag;
    run.image = backend.registryServer + '/' + run.tag + ':' + server.dockerVersion;
    var virtualNamePrefix = type.name === 'prod' ? '' : type.imageAbbreviation.toUpperCase() + '_';
    run.virtualName = '' + virtualNamePrefix + backend.capitalSiteName + '_' + server.imageAbbreviation.toUpperCase() + '_SERVICE_HOST';
  }
  // set the url
  run.url = 'http://' + run.host;
  if (run.port !== null) {
    run.url += ':' + run.port;
  }
  // watch the ones that have a dns
  if (type.hasDns) {
    var dnsPrefix = type.name === 'prod' ? '' : type.name + '-';
    // subdomain
    var subDomainName = '' + dnsPrefix + backend.siteName;
    if (!server.isMain) {
      subDomainName = subDomainName + '-' + server.imageAbbreviation;
    }
    // Note : we have to be careful that
    // the tag length is smaller than 24 characters
    if (subDomainName.length > 24) {
      this.consoleError('this sub domain name ' + subDomainName + ' is too long, you need to make it shorter than 24 characters');
      process.exit();
    }
    run.host = server.host || subDomainName + '.' + backend.domainName;
    run.url = 'https://' + run.host;
  }
}

function setAllTypesAndServersEnvironment() {
  if (this.allTypesAndProjets !== true) {
    if (typeof this.program.method === 'undefined') {
      this.program.method = 'pass';
    }
    this.mapInTypesAndServers();
    this.allTypesAndProjets = true;
  }
}

function setActivatedPythonVenv() {
  this.checkProject();
  if (typeof this.isPythonVenvActivated === 'undefined' || !this.isPythonVenvActivated) {
    var project = this.project;

    var fileName = 'venv/bin/activate';
    if (!_fs2.default.existsSync(_path2.default.join(project.dir, fileName))) {
      this.consoleError('You need to define a python venv');
      return;
    }
    this.consoleInfo('Let\'s activate the venv');
    var command = 'cd ' + project.dir + ' && source ' + fileName;
    this.consoleLog(command);
    console.log(_child_process2.default.execSync(command).toString('utf-8'));
    this.isPythonVenvActivated = true;
  }
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setAppEnvironment = setAppEnvironment;
exports.setProjectEnvironment = setProjectEnvironment;
exports.setTypeEnvironment = setTypeEnvironment;
exports.setBackendEnvironment = setBackendEnvironment;
exports.setDockerEnvironment = setDockerEnvironment;
exports.setBaseEnvironment = setBaseEnvironment;
exports.setCurrentEnvironment = setCurrentEnvironment;
exports.setMaintainerEnvironment = setMaintainerEnvironment;
exports.setRegistryEnvironment = setRegistryEnvironment;
exports.setKubernetesEnvironment = setKubernetesEnvironment;
exports.setProviderEnvironment = setProviderEnvironment;
exports.setServersEnvironment = setServersEnvironment;
exports.setServerEnvironment = setServerEnvironment;
exports.setSecretEnvironment = setSecretEnvironment;
exports.setRunEnvironment = setRunEnvironment;
exports.setAllTypesAndServersEnvironment = setAllTypesAndServersEnvironment;
exports.getActivatedPythonVenvCommand = getActivatedPythonVenvCommand;
exports.setActivatedPythonVenv = setActivatedPythonVenv;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setAppEnvironment() {
  var app = this.app;

  app.dir = _path2.default.join(__dirname, '../../');
  app.package = (0, _utils.getPackage)(app.dir);
  app.configFile = '.' + app.package.name.split('.js')[0] + '.json';
  app.requirements = (0, _utils.getRequirements)(app.dir);
  app.ttabDir = _path2.default.join(app.dir, 'node_modules/ttab/bin/ttab');
  app.pythonDir = _path2.default.join(app.dir, 'bin/index.py');
  var virtualEnvDir = _child_process2.default.execSync('echo $VIRTUAL_ENV').toString('utf-8').trim();
  app.venvDir = virtualEnvDir !== '' ? virtualEnvDir : null;
}

function setProjectEnvironment() {
  var project = this.project;

  this.read(project);
  // dirs
  project.nodeModulesDir = _path2.default.join(project.dir, 'node_modules');
  if (project.config) {
    // sub entities
    this.setTypeEnvironment();
    this.setBackendEnvironment();
  }
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
  if (typesByName) {
    var type = this.type = Object.assign({}, typesByName[program.type]);
    type.name = program.type;
    type.pip = type.name === 'localhost' ? pip : 'pip';
  }
}

function setBackendEnvironment() {
  // backend global env
  var project = this.project;

  if (typeof project.config.backend === 'undefined') {
    this.backend = null;
    return;
  }
  var backendConfig = project.config.backend;
  var backend = this.backend = Object.assign({}, backendConfig);
  backend.dir = _path2.default.join(project.dir, 'backend');
  backend.dockerEnv = backend.dockerEnv || {};
  if (typeof backend.siteName === 'undefined') {
    backend.siteName = project.package.name;
  }
  backend.dashSiteName = (0, _utils.toDashCase)(backend.siteName);
  backend.capitalUnderscoreSiteName = (0, _utils.toCapitalUnderscoreCase)(backend.dashSiteName);
  if (project.config.backend.serversByName) {
    backend.serverNames = Object.keys(project.config.backend.serversByName);
  }
  this.setDockerEnvironment();
  this.setKubernetesEnvironment();
  this.setProviderEnvironment();
  this.setServersEnvironment();
  this.setServerEnvironment();
}

function setDockerEnvironment() {
  var backend = this.backend;

  if (!backend || typeof this.backend.helpersByName === 'undefined') return;
  this.docker = this.backend.helpersByName.docker;
  this.setBaseEnvironment();
  this.setCurrentEnvironment();
  this.setRegistryEnvironment();
}

function setBaseEnvironment() {
  var docker = this.docker;

  if (!docker || typeof docker.imagesByName === 'undefined') return;
  this.base = this.docker.imagesByName.base;
}

function setCurrentEnvironment() {
  var docker = this.docker;

  if (!docker || typeof docker.imagesByName === 'undefined') return;
  this.current = this.docker.imagesByName.current;
  this.setMaintainerEnvironment();
}

function setMaintainerEnvironment() {
  var current = this.current;

  if (!current) return;
  this.maintainer = this.current.maintainer;
}

function setRegistryEnvironment() {
  var docker = this.docker;

  if (!docker) return;
  this.registry = this.docker.registry;
}

function setKubernetesEnvironment() {
  var backend = this.backend;

  if (!backend || typeof this.backend.helpersByName === 'undefined') return;
  this.kubernetes = this.backend.helpersByName.kubernetes;
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

function setServersEnvironment() {
  var backend = this.backend;

  this.serversByName = Object.assign({}, backend.serversByName);
}

function setServerEnvironment() {
  var backend = this.backend,
      docker = this.docker,
      program = this.program;

  if (typeof program.server !== 'string') {
    this.server = null;
    return;
  }
  var configServer = backend.serversByName[program.server];
  var server = this.server = Object.assign({}, configServer);
  server.name = program.server;
  server.dir = _path2.default.join(backend.dir, 'servers', server.name);
  server.package = (0, _utils.getPackage)(server.dir);
  server.gitignores = (0, _utils.getGitignores)(server.dir);
  server.configDir = _path2.default.join(server.dir, 'config');
  server.dockerEnv = server.dockerEnv || {};
  server.isNoCache = false;
  server.tag = backend.dashSiteName + '-' + server.abbreviation;
  if (typeof server.runsByTypeName === 'undefined') {
    server.runsByTypeName = {};
  }
  this.setSecretEnvironment();
  this.setRunEnvironment();
  if (server.docker) {
    docker = (0, _lodash.merge)(docker, server.docker);
  }
}

function setSecretEnvironment() {
  var server = this.server;

  if (!server) return;
  this.secret = (0, _utils.getSecret)(server.configDir);
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
  // server.runsByTypeName[type.name] = run
  // set the docker image
  if (run.name !== 'localhost') {
    run.nodeName = run.subDomain + '.' + backend.nodeDomain;
    // special case where we give to the host just the name of the dockerHost
    if (!type.hasDns) {
      run.host = run.nodeName;
    }
    run.tag = type.name === 'prod' ? server.tag : type.abbreviation + '-' + server.tag;
    var virtualNamePrefix = type.name === 'prod' ? '' : type.abbreviation.toUpperCase() + '_';
    run.virtualName = '' + virtualNamePrefix + backend.capitalUnderscoreSiteName + '_' + server.abbreviation.toUpperCase() + '_SERVICE_HOST';
  } else {
    run.tag = 'localhost-' + server.tag;
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
    var subDomain = '' + dnsPrefix + backend.dashSiteName;
    if (!server.isMain) {
      subDomain = subDomain + '-' + server.abbreviation;
    }
    // Note : we have to be careful that
    // the tag length is smaller than 24 characters
    if (subDomain.length > 24) {
      this.consoleError('this sub domain name ' + subDomain + ' is too long, you need to make it shorter than 24 characters');
      process.exit();
    }
    run.host = server.host || subDomain + '.' + backend.domain;
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

function getActivatedPythonVenvCommand() {
  this.checkProject();
  var project = this.project;

  var fileName = 'venv/bin/activate';
  if (!_fs2.default.existsSync(_path2.default.join(project.dir, fileName))) {
    this.consoleError('You need to define a python venv');
    return;
  }
  this.consoleInfo('Let\'s activate the venv');
  return 'cd ' + project.dir + ' && source ' + fileName;
}

function setActivatedPythonVenv() {
  if (typeof this.isPythonVenvActivated === 'undefined' || !this.isPythonVenvActivated) {
    var command = this.getActivatedPythonVenvCommand();
    this.consoleLog(command);
    console.log(_child_process2.default.execSync(command).toString('utf-8'));
    this.isPythonVenvActivated = true;
  }
}
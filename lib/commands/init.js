'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setAppEnvironment = setAppEnvironment;
exports.setTemplatesEnvironment = setTemplatesEnvironment;
exports.setProjectEnvironment = setProjectEnvironment;
exports.setTypesEnvironment = setTypesEnvironment;
exports.setDataEnvironment = setDataEnvironment;
exports.setBackendEnvironment = setBackendEnvironment;
exports.setServersEnvironment = setServersEnvironment;
exports.init = init;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var backendKeys = ['buildPushDockerHost', 'dockerPort', 'masterServer', 'registryServer', 'smtpHost', 'siteName'];

var typeKeys = ['dockerHost', 'imageAbbreviation'];

var serverKeys = ['baseDockerVersion', 'baseTag', 'dockerEnv', 'imageAbbreviation', 'maintainer', 'typesByName'];

var typeKeysInServer = ['dockerHost', 'host', 'port'];

function setAppEnvironment() {
  var _this = this;

  var app = this.app = {};
  app.dir = _path2.default.join(__dirname, '../../');
  app.binDir = _path2.default.join(app.dir, 'bin');
  app.nodeModulesDir = _path2.default.join(app.dir, 'node_modules');
  app.imagesDir = _path2.default.join(app.dir, 'images');
  app.utilsDir = _path2.default.join(app.dir, 'utils');
  app.pythonBinDir = _path2.default.join(app.binDir, 'index.py');
  app.templatesDir = _path2.default.join(app.dir, 'templates');
  app.packageDir = _path2.default.join(app.dir, 'package.json');
  app.package = JSON.parse(_fs2.default.readFileSync(app.packageDir));
  app.configDir = _path2.default.join(app.dir, '.' + app.package.name + '.json');
  app.config = this.getConfig(app.dir);
  app.templatesByName = {};
  _fs2.default.readdirSync(app.templatesDir).forEach(function (fileOrFolderName) {
    var appTemplateDir = _path2.default.join(app.templatesDir, fileOrFolderName);
    var appTemplateConfig = _this.getConfig(appTemplateDir);
    if (appTemplateConfig) {
      appTemplateConfig.dir = appTemplateDir;
      if (appTemplateConfig.backend) {
        appTemplateConfig.backendDir = _path2.default.join(appTemplateDir, 'backend');
        appTemplateConfig.serversDir = _path2.default.join(appTemplateConfig.backendDir, 'servers');
      }
      // each template has in its config json only one item in the templatesByName
      var templateName = Object.keys(appTemplateConfig.templatesByName)[0];
      app.templatesByName[templateName] = appTemplateConfig;
    }
  });
  this.ttabDir = _path2.default.join(app.nodeModulesDir, 'ttab/bin/ttab');
}

function setTemplatesEnvironment() {
  var app = this.app,
      project = this.project;

  project.templatesByName = {};
  project.templatesByName = project.templateNames.forEach(function (templateName) {
    var appTemplate = app.templatesByName[templateName];
    project.templatesByName[templateName] = appTemplate;
  });
}

function setProjectEnvironment() {
  var project = this.project || {};
  project.packageDir = _path2.default.join(project.dir, 'package.json');
  project.package = (0, _utils.getPackage)(project.dir);
  this.project.config = this.getConfig(project.dir);
  // templates
  this.setTemplatesEnvironment();
  // types
  this.setTypesEnvironment();
  // backend
  if (project.config.backend) {
    this.setBackendEnvironment();
  }
}

function setTypesEnvironment() {
  var _this2 = this;

  var app = this.app,
      project = this.project;

  this.typeNames = Object.keys(project.config.typesByName);
  this.typeNames.forEach(function (typeName) {
    var appType = app.config.typesByName[typeName];
    var projectType = project.config.typesByName[typeName];
    typeKeys.forEach(function (key) {
      projectType[key] = projectType[key] || appType[key];
    });
    if (typeName !== 'localhost') {
      projectType.dockerServer = projectType.dockerHost + ':' + _this2.dockerPort;
      projectType.socket = '-H tcp://' + projectType.dockerServer;
    }
  });
  if (this.program.type) {
    this.projectType = project.config.typesByName[this.program.type];
  }
}

function setDataEnvironment() {
  var backend = this.backend;

  var data = backend.data = {};
  data.dir = _path2.default.join(backend.dir, 'data');
  data.jsonDir = _path2.default.join(data.dir, 'json_data');
  data.rethinkDbDir = _path2.default.join(data.dir, 'rethinkdb_data');
}

function setBackendEnvironment() {
  // backend global env
  var backend = this.backend = {};
  var app = this.app,
      project = this.project;

  backend.dir = _path2.default.join(project.dir, 'backend');
  backend.serversDir = _path2.default.join(backend.dir, 'servers');
  backend.pythonScriptsDir = _path2.default.join(backend.dir, 'scripts');
  this.setDataEnvironment();
  backendKeys.forEach(function (key) {
    backend[key] = app.config.backend[key] || project.config.backend[key];
  });
  backend.buildPushDockerServer = backend.buildPushDockerHost + ':' + backend.dockerPort;
  backend.buildPushSocket = '-H tcp://' + backend.buildPushDockerServer;
  backend.siteName = backend.siteName || project.package.name;
  backend.capitalSiteName = backend.siteName.toUpperCase();
  if (typeof project.config.typesByName === 'undefined') {
    project.config.typesByName = app.config.typesByName;
  }
  backend.namedTypeNames = this.typeNames.filter(function (typeName) {
    return project.config.typesByName[typeName].hasDns;
  });
  backend.serverNames = Object.keys(project.config.backend.serversByName);
  this.setServersEnvironment();
}

function setServersEnvironment() {
  var _this3 = this;

  var app = this.app,
      backend = this.backend,
      project = this.project;

  backend.serverNames.forEach(function (serverName) {
    var appServer = app.config.backend.serversByName[serverName];
    var projectServer = project.config.backend.serversByName[serverName];
    projectServer.dir = _path2.default.join(backend.serversDir, serverName);
    projectServer.appServerDir = _path2.default.join(app.templatesDir, 'backend/servers', serverName);
    projectServer.configDir = _path2.default.join(projectServer.dir, 'config');
    serverKeys.forEach(function (key) {
      projectServer[key] = projectServer[key] || appServer[key];
    });
    projectServer.baseImageDir = _path2.default.join(app.imagesDir, projectServer.baseTag);
    projectServer.isNoCache = false;
    projectServer.baseImage = backend.registryServer + '/' + projectServer.baseTag + ':' + projectServer.baseDockerVersion;
    projectServer.tag = backend.siteName + '-' + projectServer.imageAbbreviation;
    if (typeof projectServer.typesByName === 'undefined') {
      projectServer.typesByName = {};
    }

    // specify by type
    _this3.typeNames.forEach(function (typeName) {
      var appType = app.config.typesByName[typeName];
      if (typeof projectServer.typesByName[typeName] === 'undefined') {
        projectServer.typesByName[typeName] = {};
      }
      var projectServerType = projectServer.typesByName[typeName];
      typeKeysInServer.forEach(function (typeKey) {
        if (typeof projectServerType[typeKey] === 'undefined') {
          projectServerType[typeKey] = projectServerType[typeKey] || appType[typeKey];
        }
      });
      // set the docker image
      if (typeName !== 'localhost') {
        // serverSubDomain
        projectServerType.serverSubDomain = projectServerType.dockerHost.split('.')[0];
        // special case where we give to the host just the name of the dockerHost
        if (typeName === 'unname') {
          projectServerType.host = appType.dockerHost;
        }
        projectServerType.tag = typeName === 'prod' ? projectServer.tag : appType.imageAbbreviation + '-' + projectServer.tag;
        projectServerType.image = backend.registryServer + '/' + projectServerType.tag + ':' + projectServer.dockerVersion;
      }
      // set the url
      projectServerType.url = 'http://' + projectServerType.host;
      if (projectServerType.port !== null) {
        projectServerType.url += ':' + projectServerType.port;
      }
      // watch the ones that have a dns
      if (backend.namedTypeNames.includes(typeName)) {
        var dnsPrefix = typeName === 'prod' ? '' : typeName + '-';
        // subdomain
        var subDomainName = '' + dnsPrefix + backend.siteName;
        if (!projectServer.isMain) {
          subDomainName = subDomainName + '-' + projectServer.imageAbbreviation;
        }
        // Note : we have to be careful that
        // the tag length is smaller than 24 characters
        if (subDomainName.length > 24) {
          _this3.consoleError('this sub domain name ' + subDomainName + ' is too long, you need to make it shorter than 24 characters');
          process.exit();
        }
        projectServerType.host = projectServer.host || subDomainName + '.' + backend.domainName;
        projectServerType.url = 'https://' + projectServerType.host;
        var virtualNamePrefix = typeName === 'prod' ? '' : appType.imageAbbreviation.toUpperCase() + '-';
        projectServerType.virtualName = '' + virtualNamePrefix + backend.capitalSiteName + '_' + projectServer.imageAbbreviation.toUpperCase() + '_SERVICE_HOST';
      }
    });
  });
  if (this.program.server) {
    this.projectServer = project.config.serversByName[this.program.server];
    if (this.program.type) {
      this.projectServerConfig = this.projectServer.typesByName[this.program.type];
    }
  }
}

function init(program) {
  // set attributes
  this.program = program;
  this.setAppEnvironment();
  // project env
  if (process.cwd() === this.app.dir.replace(/\/$/, '')) {
    return;
  }
  this.projectDir = process.cwd();
  this.setProjectEnvironment();
}
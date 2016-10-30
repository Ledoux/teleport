'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.installPackage = installPackage;
exports.installBackend = installBackend;
exports.getInstallPythonLibCommand = getInstallPythonLibCommand;
exports.installPythonLib = installPythonLib;
exports.installDockerFiles = installDockerFiles;
exports.installServiceFiles = installServiceFiles;
exports.installControllerFiles = installControllerFiles;
exports.installUwsgiFiles = installUwsgiFiles;
exports.installClientSecretFiles = installClientSecretFiles;
exports.install = install;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function installPackage() {
  var _this = this;

  var project = this.project,
      program = this.program;
  // like available ports

  if (program.web !== 'off') {
    (function () {
      // get the whole available
      var availablePorts = _this.getAvailablePorts();
      _this.serverNames.forEach(function (serverName, index) {
        var server = project.config.serversByName[serverName];
        (0, _lodash.toPairs)(server.typesByName).forEach(function (pairs) {
          var typeName = pairs.typeName,
              type = pairs.type;

          program.server = serverName;
          program.type = typeName;
          type.port = availablePorts[0];
          // delete this one in the availables
          delete availablePorts[0];
        });
      });
    })();
  }
  // set maybe the python command
  if (_fs2.default.existsSync(this.webrouterRequirementsDir) || _fs2.default.existsSync(this.websocketerRequirementsDir)) {
    if (typeof project.config.python === 'undefined') {
      project.config.python = _child_process2.default.execSync('which python').toString('utf-8').trim();
    }
  }
}

function installBackend() {
  var backend = this.backend,
      program = this.program,
      project = this.project;
  // create a constants.json if not

  if (_fs2.default.existsSync(backend.configDir)) {
    if (!_fs2.default.existsSync(backend.constantsDir)) {
      _fs2.default.writeFileSync(backend.constantsDir, '{}');
    }
  }
  // maybe create a venv python
  if (program.venv !== 'false') {
    if (_fs2.default.existsSync(this.webrouterRequirementsDir) || _fs2.default.existsSync(this.websocketerRequirementsDir)) {
      this.createVenv();
    }
  }
  // deploy
  this.installDockerFiles();
  this.installServiceFiles();
  this.installControllerFiles();
  this.installClientSecretFiles();
  this.installUwsgiFiles();
  if (program.venv !== 'false' && project.config.python) {
    this.installPythonLib();
  }
}

function getInstallPythonLibCommand() {
  var app = this.app,
      program = this.program,
      project = this.project;

  var sudo = program.permission;
  var commands = ['cd ' + project.dir + ' && source venv/bin/activate'];
  this.webrouterBaseRequirementsDir = _path2.default.join(this.appImagesDir, project.config.webrouterBaseTag, 'config/requirements_webrouter.txt');
  if (_fs2.default.existsSync(this.webrouterBaseRequirementsDir)) {
    commands.push('cd ' + project.dir + ' && pip install -r ' + this.webrouterBaseRequirementsDir);
  }
  this.websocketerBaseRequirementsDir = _path2.default.join(app.imagesDir, project.config.websocketerBaseTag, 'config/requirements_websocketer.txt');
  if (_fs2.default.existsSync(this.websocketerBaseRequirementsDir)) {
    commands.push('cd ' + project.dir + ' && pip install -r ' + this.websocketerBaseRequirementsDir);
  }
  // for some reason, some python lib requires sudo install even if we are in venv mode
  commands.push('cd ' + project.dir + ' && ' + sudo + ' pip install -r ' + this.webrouterRequirementsDir);
  commands.push('cd ' + project.dir + ' && pip install -r ' + this.websocketerRequirementsDir);
  return commands.join(' && ');
}

function installPythonLib() {
  var command = this.getInstallPythonLibCommand();
  this.consoleInfo('...Installing the python deps in your venv, it can take a little of time, and if you meet permission errors, do it in sudo, with the \'--permission sudo\' option, like \'tpt -c --permission sudo\'');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function installDockerFiles() {
  var _this2 = this;

  this.typeNames.filter(function (typeName) {
    return typeName !== 'localhost';
  }).forEach(function (typeName) {
    var type = _this2.projectConfig.typesByName[typeName];
    _this2.serverNames.forEach(function (serverName) {
      var projectServersByName = _this2.projectConfig.serversByName;
      var server = projectServersByName[serverName];
      var typeInServer = server.typesByName[typeName];
      var fileName = 'Dockerfile';
      var templateFileDir = _path2.default.join(server.appServerDir, fileName);
      var templateFile = _fs2.default.readFileSync(templateFileDir, 'utf-8');
      var installedFileDir = server.dir + '/' + typeName + '_' + fileName;
      // add some variables
      var serverUrlsByName = {};
      _this2.serverNames.forEach(function (serverName) {
        return serverUrlsByName[serverName.toUpperCase() + '_URL'] = projectServersByName[serverName][typeName + 'Url'];
      });
      var dockerEnv = Object.assign(serverUrlsByName, server.dockerEnv);
      var extraConfig = Object.keys(dockerEnv).map(function (key) {
        return key + ' ' + dockerEnv[key];
      }).join('\n');
      var format = Object.assign({ extraConfig: extraConfig }, typeInServer, type, server);
      // replace
      _fs2.default.writeFileSync(installedFileDir, (0, _utils.formatString)(templateFile, format));
    });
  });
}

function installServiceFiles() {
  var _this3 = this;

  this.namedTypeNames.forEach(function (namedTypeName) {
    var type = _this3.projectConfig.typesByName[namedTypeName];
    _this3.serverNames.forEach(function (serverName) {
      var server = _this3.projectConfig.serversByName[serverName];
      var typeInServer = server.typesByName[namedTypeName];
      var fileName = namedTypeName + '_service.yaml';
      var fileDir = server.configDir + '/' + fileName;
      var file = _fs2.default.readFileSync(fileDir, 'utf-8');
      _fs2.default.writeFileSync(fileDir, (0, _utils.formatString)(file, Object.assign({}, typeInServer, type)));
    });
  });
  return this;
}

function installControllerFiles() {
  var _this4 = this;

  this.namedTypeNames.forEach(function (namedTypeName) {
    var type = _this4.projectConfig.typesByName[namedTypeName];
    _this4.serverNames.forEach(function (serverName) {
      var server = _this4.projectConfig.serversByName[serverName];
      var typeInServer = server.typesByName[namedTypeName];
      var fileName = namedTypeName + '_controller.yaml';
      var fileDir = server.configDir + '/' + fileName;
      var file = _fs2.default.readFileSync(fileDir, 'utf-8');
      _fs2.default.writeFileSync(fileDir, (0, _utils.formatString)(file, Object.assign({}, typeInServer, type)));
    });
  });
  return this;
}

function installUwsgiFiles() {
  var _this5 = this;

  this.typeNames.forEach(function (typeName) {
    var type = _this5.projectConfig.typesByName[typeName];
    _this5.serverNames.forEach(function (serverName) {
      var uwsgiName = serverName === 'webrouter' ? 'uwsgi' : 'guwsgi';
      var server = _this5.projectConfig.serversByName[serverName];
      var typeInServer = server.typesByName[typeName];
      var fileName = typeName + '_' + uwsgiName + '.ini';
      var fileDir = server.configDir + '/' + fileName;
      var file = _fs2.default.readFileSync(fileDir, 'utf-8');
      _fs2.default.writeFileSync(fileDir, (0, _utils.formatString)(file, Object.assign({}, typeInServer, type)));
    });
  });
  return this;
}

function installClientSecretFiles() {
  var _this6 = this;

  this.typeNames.forEach(function (typeName) {
    var type = _this6.projectConfig.typesByName[typeName];
    _this6.serverNames.forEach(function (serverName) {
      var server = _this6.projectConfig.serversByName[serverName];
      var typeInServer = server.typesByName[typeName];
      var fileName = typeName + '_client_secret.json';
      var fileDir = server.configDir + '/' + fileName;
      if (!_fs2.default.existsSync(fileDir)) {
        return;
      }
      var file = _fs2.default.readFileSync(fileDir, 'utf-8');
      var format = Object.assign({}, typeInServer, type);
      _fs2.default.writeFileSync(fileDir, (0, _utils.formatString)(file, format));
    });
  });
  return this;
}

function install() {
  var project = this.project;

  this.installPackage();
  if (project.backend) {
    this.installBackend();
  }
}
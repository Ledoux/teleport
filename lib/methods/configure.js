'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configure = configure;
exports.configureScript = configureScript;
exports.configureProject = configureProject;
exports.configureProjectConfig = configureProjectConfig;
exports.configureProjectPackage = configureProjectPackage;
exports.configureProjectGitignore = configureProjectGitignore;
exports.configureServer = configureServer;
exports.configureServerConfig = configureServerConfig;
exports.configureServerPackage = configureServerPackage;
exports.configureServerGitignore = configureServerGitignore;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function configure() {
  var project = this.project;
  // script

  if (_fs2.default.existsSync(_path2.default.join(this.project.dir, 'bin/configure.sh'))) {
    this.configureScript();
  }
  // project
  this.configureProject();
  // servers
  // this.program.method = 'configureServer'
  // this.mapInServers()
  // info
  this.consoleInfo('Your ' + project.package.name + ' project was successfully configured!');
}

function configureScript() {
  var command = 'cd ' + this.project.dir + ' && sh bin/configure.sh';
  this.consoleInfo('Let\'s configure the project');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function configureProject() {
  var project = this.project;

  this.configureProjectConfig();
  this.configureProjectPackage();
  this.configureProjectGitignore();
  this.write(project);
}

function configureProjectConfig() {
  var _this = this;

  // unpack
  var project = this.project;
  // init again the config

  project.config.templateNames = this.getTemplateNames();

  // merge
  project.config = _lodash.merge.apply(undefined, [project.config].concat(_toConsumableArray(project.config.templateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    var templateConfig = _this.getConfig(templateDir);
    // remove attributes that are specific to the project
    delete templateConfig.templateNames;
    if (templateConfig.backend) {
      delete templateConfig.backend.siteName;
    }
    return templateConfig;
  }))));
}

function configureProjectPackage() {
  var project = this.project;

  var templateDependencies = this.getTemplateDependencies();
  if (Object.keys(templateDependencies).length > 0) {
    project.package = (0, _lodash.merge)(project.package, {
      devDependencies: templateDependencies
    });

    // merge
    project.package = _lodash.merge.apply(undefined, [project.package].concat(_toConsumableArray(Object.keys(templateDependencies).map(function (templateName) {
      var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
      var templatePackage = (0, _utils.getPackage)(templateDir);
      var dependencies = templatePackage.dependencies,
          devDependencies = templatePackage.devDependencies;

      return { dependencies: dependencies, devDependencies: devDependencies };
    }))));
  }
}

function configureProjectGitignore() {
  var project = this.project;

  project.gitignores = (0, _utils.getGitignores)(project.dir);
  project.config.templateNames.forEach(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    var gitignores = (0, _utils.getGitignores)(templateDir);
    project.gitignores = project.gitignores.concat(gitignores);
  });
  project.gitignores = (0, _lodash.uniq)(project.gitignores);
}

function configureServer() {
  var server = this.server;
  // this.configureServerConfig()

  this.configureServerPackage();
  // this.configureServerGitignore()
  // this.write(server)
  _mkdirp2.default.sync(server.dir);
  (0, _utils.writePackage)(server.dir, server.package);
  // writeGitignore(server.dir, server.gitignores)
}

function configureServerConfig() {
  var _this2 = this;

  // unpack
  var project = this.project,
      server = this.server;

  // merge

  server.config = _lodash.merge.apply(undefined, [server.config || {}].concat(_toConsumableArray(project.config.templateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName, 'backend/servers', server.name);
    var templateConfig = _this2.getConfig(templateDir);
    return templateConfig;
  }))));
}

function configureServerPackage() {
  // unpack
  var project = this.project,
      server = this.server;

  // merge

  server.package = _lodash.merge.apply(undefined, [server.package || {}].concat(_toConsumableArray(project.config.templateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName, 'backend/servers', server.name);
    var templatePackage = (0, _utils.getPackage)(templateDir);
    return templatePackage;
  }))));
}

function configureServerGitignore() {
  // unpack
  var project = this.project,
      server = this.server;

  // merge

  server.gitignores = (0, _lodash.uniq)((0, _lodash.flatten)((server.gitignores || []).concat(project.config.templateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName, 'backend/servers', server.name);
    var templateGitignores = (0, _utils.getGitignores)(templateDir);
    return templateGitignores;
  }))));
}
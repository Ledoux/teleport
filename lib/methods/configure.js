'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configure = configure;
exports.configureProject = configureProject;
exports.configureScript = configureScript;
exports.configureProjectConfig = configureProjectConfig;
exports.configureProjectPackage = configureProjectPackage;
exports.configureProjectGitignore = configureProjectGitignore;
exports.configureServerBaseRequirements = configureServerBaseRequirements;
exports.configureProjectBoilerplate = configureProjectBoilerplate;
exports.getConfigureProjectBoilerplateCommand = getConfigureProjectBoilerplateCommand;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function configure() {
  this.getLevelMethod('configure')();
  this.consoleInfo('Your teleport configure was sucessful !');
}

function configureProject() {
  var project = this.project;
  // write

  this.configureScript();
  this.configureProjectConfig();
  this.configureProjectPackage();
  this.configureProjectGitignore();
  this.write(project);
  // boilerplate
  this.configureProjectBoilerplate();
  // base requirements
  this.setProjectEnvironment();
  this.program.method = 'configureServerBaseRequirements';
  this.mapInServers();
  // info
  this.consoleInfo('Your ' + project.package.name + ' project was successfully configured!');
}

function configureScript() {
  var command = 'cd ' + this.project.dir + ' && npm run configure';
  this.consoleInfo('Let\'s configure the project');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function configureProjectConfig() {
  var _this = this;

  // unpack
  var project = this.project;
  // init again the config

  project.config.templateNames = project.config.templateNames || this.getTemplateNames();
  project.allTemplateNames = this.getAllTemplateNames();

  // merge
  project.config = _lodash.merge.apply(undefined, [project.config].concat(_toConsumableArray(project.allTemplateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    var templateConfig = _this.getConfig(templateDir);
    // special backend
    if (templateConfig.backend) {
      // set the parent template name in the server in order to
      // make them able to retrieve their file templates from the scope
      // for install time
      (0, _lodash.values)(templateConfig.backend.serversByName).forEach(function (server) {
        server.templateName = templateName;
      });
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
  }
}

function configureProjectGitignore() {
  var project = this.project;

  project.gitignore = (0, _lodash.merge)({
    'secret.json': '',
    'venv': ''
  }, project.allTemplateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    return (0, _utils.getGitignores)(templateDir);
  }));
}

function configureServerBaseRequirements() {
  var project = this.project,
      server = this.server;

  var allRequirements = (0, _lodash.uniq)((0, _lodash.flatten)((0, _lodash.reverse)(project.allTemplateNames.map(function (templateName) {
    var fileDir = _path2.default.join(project.nodeModulesDir, templateName, 'backend/servers', server.name, 'config');
    return (0, _utils.getRequirements)(fileDir, 'base');
  }))));
  (0, _utils.writeRequirements)(server.configDir, allRequirements, 'base');
}

function configureProjectBoilerplate() {
  var project = this.project;

  this.consoleInfo('Let\'s copy the templates in ' + project.package.name);
  var command = this.getConfigureProjectBoilerplateCommand();
  this.consoleLog(command);
  var buffer = _child_process2.default.execSync(command);
  console.log(buffer.toString('utf-8'));
}

function getConfigureProjectBoilerplateCommand() {
  var _this2 = this;

  var configFile = this.app.configFile,
      project = this.project;

  return project.allTemplateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    // we exclude package.json and config file because we want to merge them
    // and we exclude also files mentionned in the excludes item of the template
    // config
    var templateConfig = _this2.getConfig(templateDir);
    var totalExcludedDirs = (templateConfig.excludedDirs || []).concat(['base_Dockerfile*', 'base_requirements*', 'package.json', '.gitignore', configFile, '\'_p_*\'']);
    var excludeOption = totalExcludedDirs.map(function (exclude) {
      return '--exclude=' + exclude;
    }).join(' ');
    return 'rsync -rv ' + excludeOption + ' ' + templateDir + '/ ' + project.dir;
  }).join(' && ');
}
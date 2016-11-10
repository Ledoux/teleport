'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.add = add;
exports.addScope = addScope;
exports.addUpdatedPackage = addUpdatedPackage;
exports.addUpdatedConfig = addUpdatedConfig;
exports.addUpdatedGitignore = addUpdatedGitignore;
exports.addProject = addProject;
exports.copyTemplates = copyTemplates;
exports.getCopyTemplatesCommand = getCopyTemplatesCommand;
exports.addScopeConfig = addScopeConfig;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function add() {
  this.getLevelMethod('add')();
  this.consoleInfo('Your teleport add was sucessful !');
}

function addScope() {
  // unpack
  var program = this.program;
  // warn

  if (typeof program.scope !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --scope <your_scope_name> in your command');
    return;
  }
  this.consoleInfo('wait a second... We create your ' + program.scope + ' scope !');
}

function addUpdatedPackage() {
  var project = this.project,
      program = this.program;

  var name = project.package ? project.package.name : program.project;
  project.package = _lodash.merge.apply(undefined, [{
    name: name,
    version: '0.0.1'
  }].concat(_toConsumableArray((0, _lodash.values)(project.templatesByName).map(function (template) {
    return (0, _utils.getPackage)(template.dir);
  }))));
}

function addUpdatedConfig() {
  var _this = this;

  var project = this.project,
      program = this.program,
      scope = this.scope;

  project.config = (0, _lodash.merge)({
    scope: {
      dir: scope.dir,
      name: scope.package.name
    }
  }, scope.config);
  delete project.config.isScope;
  delete project.config.templatesByName;
  var templateNames = program.templates.split(',');
  project.config = _lodash.merge.apply(undefined, [project.config].concat(_toConsumableArray(templateNames.map(function (templateName) {
    var templateDir = _path2.default.join(scope.dir, 'templates', templateName);
    var templateConfig = _this.getConfig(templateDir);
    if (templateConfig) {
      // set the parent template name in the server in order to
      // make them able to retrieve their file templates from the scope
      // for install time
      (0, _lodash.values)(templateConfig.backend.serversByName).forEach(function (server) {
        server.templateName = templateName;
      });
    }
    return templateConfig;
  }))));
  // update requirements
  project.config.requirements = this.app.config.requirements;
}

function addUpdatedGitignore() {
  var project = this.project;

  project.gitignore = _lodash.merge.apply(undefined, [{
    'secret.json': '',
    'venv': ''
  }].concat(_toConsumableArray((0, _lodash.values)(project.templatesByName).map(function (template) {
    return (0, _utils.getGitignore)(template.dir);
  }))));
}

function addProject() {
  var program = this.program,
      project = this.project;

  this.setScopeEnvironment();
  this.addUpdatedPackage();
  this.addUpdatedConfig();
  this.addUpdatedGitignore();
  this.copyTemplates();
  this.write(project);
  this.consoleInfo('Your ' + program.project + ' was successfully augmented with ' + program.templates + ' !');
}

function copyTemplates() {
  var program = this.program;

  this.consoleInfo('Let\'s copy the templates in ' + program.project);
  var command = this.getCopyTemplatesCommand();
  this.consoleLog(command);
  var buffer = _child_process2.default.execSync(command);
  console.log(buffer.toString('utf-8'));
}

function getCopyTemplatesCommand() {
  var configFile = this.app.configFile,
      program = this.program,
      project = this.project,
      scope = this.scope;

  if (typeof program.templates !== 'string') {
    this.consoleWarn('You didn\'t mention any particular templates, please add --templates <template1>,<template2>  in your command');
    return;
  }
  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular project, please add --project <your_project_name> in your command');
    return;
  }
  return (0, _lodash.toPairs)(project.config.templatesByName).map(function (pairs) {
    var _pairs = _slicedToArray(pairs, 2),
        templateName = _pairs[0],
        template = _pairs[1];

    var scopeTemplateDir = _path2.default.join(scope.dir, 'templates', templateName);
    // we exclude package.json and config file because we want to merge them
    // and we exclude also files mentionned in the excludes item of the template
    // config
    // add package.json and configFile
    var totalExcludedDirs = (template.excludedDirs || []).concat(['package.json', '.gitignore', configFile, '\'_p_*\'']);
    var excludeOption = totalExcludedDirs.map(function (exclude) {
      return '--exclude=' + exclude;
    }).join(' ');
    return 'rsync -rv ' + excludeOption + ' ' + scopeTemplateDir + '/ ' + project.dir;
  }).join(' && ');
}

function addScopeConfig() {
  var app = this.app,
      scope = this.scope;

  scope.config = {
    'python': '</usr/local/bin/python>',
    'backend': {
      'buildPushDockerHost': '<prod.foo.org>',
      'dockerPort': '<4243>',
      'domainName': '<foo.org>',
      'kubernetesUrl': '<http://infra.foo.ai:8080/api/v1/proxy/namespaces/kube-system/services/kubernetes-dashboard/>',
      'masterHost': '<infra.foo.org>',
      'registryServer': '<registry.foo.ai:5000>',
      'serversByName': {
        '<flask-webrouter>': {
          'baseDockerVersion': '<0.1>',
          'baseTag': '<flask-wbr>',
          'isMain': true,
          'typesByName': {
            'localhost': {
              'host': '<localhost>',
              'port': '<5000>'
            }
          },
          'maintainer': '<Erwan Ledoux erwan.ledoux@snips.ai>',
          'imageAbbreviation': '<wbr>'
        },
        '<flask-websocketer>': {
          'baseTag': '<flask-wbs>',
          'baseDockerVersion': '<0.1>',
          'typesByName': {
            'localhost': {
              'host': '<localhost>',
              'port': '<5001>'
            }
          },
          'maintainer': '<Erwan Ledoux erwan.ledoux@snips.ai>',
          'imageAbbreviation': '<wbs>'
        }
      }
    },
    'typesByName': {
      'localhost': {},
      'unname': {
        'dockerHost': '<dev.foo.org>',
        'imageAbbreviation': '<unm>'
      },
      'staging': {
        'dockerHost': '<dev.foo.org>',
        'imageAbbreviation': '<stg>',
        'hasDns': true
      },
      'prod': {
        'dockerHost': '<prod.foo.org>',
        'imageAbbreviation': '<prod>',
        'hasDns': true
      }
    }
  };
  _fs2.default.writeFileSync(_path2.default.join(scope.dir, app.configFile), (0, _jsonStableStringify2.default)(scope.config, { space: '\t' }));
}
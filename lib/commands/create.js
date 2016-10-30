'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCopyTemplatesCommand = getCopyTemplatesCommand;
exports.copyTemplates = copyTemplates;
exports.createPackage = createPackage;
exports.createConfig = createConfig;
exports.getCreateVenvCommand = getCreateVenvCommand;
exports.createVenv = createVenv;
exports.create = create;

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

function getCopyTemplatesCommand() {
  var _program = this.program,
      name = _program.name,
      templates = _program.templates,
      project = this.project;

  if (typeof templates !== 'string') {
    this.consoleWarn('You didn\'t mention any particular templates, please add --templates <template1>,<template2>  in your command');
    return;
  }
  if (typeof name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command');
    return;
  }
  return (0, _lodash.values)(project.templatesByName).map(function (template) {
    return (
      // we exclude package.json and config file because we want to merge them
      'rsync -rv --exclude=package.json --exclude=.' + name + '.json ' + template.dir + '/ ' + project.dir
    );
  }).join(' && ');
}

function copyTemplates() {
  var program = this.program;

  this.consoleInfo('Let\'s copy the templates in ' + program.name);
  var command = this.getCopyTemplatesCommand();
  this.consoleLog(command);
  var buffer = _child_process2.default.execSync(command);
  // console.log(buffer.toString('utf-8'))
  // sleep(1000)
}

function createPackage() {
  var program = this.program,
      project = this.project;

  this.consoleInfo('Let\'s create package in ' + program.name);
  project.package = _lodash.merge.apply(undefined, [{
    name: program.name,
    version: '0.0.1'
  }].concat(_toConsumableArray((0, _lodash.values)(project.templatesByName).map(function (template) {
    return (0, _utils.getPackage)(template.dir);
  }))));
  project.packageDir = _path2.default.join(project.dir, 'package.json');
  _fs2.default.writeFileSync(project.packageDir, (0, _jsonStableStringify2.default)(project.package, { space: '\t' }));
  this.consoleInfo('package written');
}

function createConfig() {
  var _this = this;

  var app = this.app,
      project = this.project;

  this.consoleInfo('Let\'s create config in ' + project.name);
  project.config = _lodash.merge.apply(undefined, [app.config].concat(_toConsumableArray((0, _lodash.values)(project.templatesByName).map(function (template) {
    return _this.getConfig(template.dir);
  }))));
  project.configDir = _path2.default.join(project.dir, '.' + app.package.name + '.json');
  _fs2.default.writeFileSync(project.configDir, (0, _jsonStableStringify2.default)(project.config, { space: '\t' }));
  this.consoleInfo('config written');
}

function getCreateVenvCommand() {
  var project = this.project;

  return 'cd ' + project.name + ' && virtualenv -p ' + project.config.python + ' venv';
}

function createVenv() {
  var command = this.getCreateVenvCommand();
  this.consoleInfo('... Installing a python venv for our backend');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function create() {
  var app = this.app,
      program = this.program;
  // copy the boilerplate

  if (typeof program.name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command');
    return;
  }
  this.consoleInfo('wait a second... We create your ' + program.name + ' project !');
  // env
  var project = this.project = { dir: _path2.default.join(process.cwd(), program.name) };
  if (_fs2.default.existsSync(project.dir)) {
    this.consoleWarn('There is already a ' + program.name + ' here...');
    return;
  }
  // copy merge from templates
  project.templateNames = program.templates.split(',');
  project.templatesByName = {};
  project.templateNames.forEach(function (templateName) {
    var appTemplate = app.templatesByName[templateName];
    project.templatesByName[templateName] = appTemplate;
  });
  this.copyTemplates();
  // create package config
  this.createPackage();
  this.createConfig();
  // set backend end
  this.setProjectEnvironment();
  // configure
  this.configure();
  // install
  // this.install()
  // console
  this.consoleInfo('Your ' + program.name + ' was successfully created, go inside with \'cd ' + program.name + '\' !');
}
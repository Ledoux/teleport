'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _utils = require('../utils');

function init(program) {
  this.program = program;
  var app = this.app = {};
  this.setAppEnvironment();
  this.level = null; // has to be after either scope or project
  var project = this.project = {};
  var scope = this.scope = {};
  if (app.currentScope && typeof app.currentScope !== 'undefined') {
    scope.dir = app.currentScope.dir;
  }

  // determine where we are
  this.currentDir = process.cwd();
  // if we are inside of the app folder itself better is to leave, because
  // we don't have anything to do here
  this.isAppDir = this.currentDir === app.dir.replace(/\/$/, '');
  if (this.isAppDir) {
    this.consoleWarn('You are in the ' + app.package.name + ' folder... Better is to exit :)');
    process.exit();
  }
  // if we want to create something, then we return because we are not in a scope or in a project yet
  if (typeof program.create !== 'undefined') {
    this.level = ['scope', 'project'].find(function (level) {
      return program[level];
    });
    return;
  }
  // if it is not a create method, it means that we are either in a scope or in a
  // project to do something
  this.currentConfig = this.getConfig(this.currentDir);
  // split given where we are
  if (this.currentConfig) {
    if (this.currentConfig.isScope === true) {
      this.level = 'scope';
      scope.dir = this.currentDir;
      this.setScopeEnvironment();
    } else if ((0, _utils.getPackage)(this.currentDir)) {
      scope.dir = this.currentConfig.scope.dir;
      this.setScopeEnvironment();
      this.level = 'project';
      project.dir = this.currentDir;
      this.setProjectEnvironment();
    }
  }
  // exit else
  if (!this.level) {
    this.consoleWarn('You neither are in a scope folder or in a project folder');
    process.exit();
  }
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.createScope = createScope;
exports.createProject = createProject;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function create() {
  this.getLevelMethod('create')();
  this.consoleInfo('Your teleport create was sucessful !');
}

function createScope() {
  // unpack
  var program = this.program;
  // warn

  if (typeof program.scope !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --scope <your_scope_name> in your command');
    return;
  }
  this.consoleInfo('wait a second... We create your ' + program.scope + ' scope !');
}

function createProject() {
  // unpack
  var project = this.project,
      program = this.program;
  // warn

  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --project <your_project_name> in your command');
    return;
  }
  // check
  project.dir = _path2.default.join(this.currentDir, program.project);
  this.consoleInfo('wait a second... We create your ' + program.project + ' project !');
  if (_fs2.default.existsSync(project.dir)) {
    this.consoleWarn('There is already a ' + program.project + ' here...');
    process.exit();
  }
  // add
  this.add();
  //
  this.consoleInfo('Your ' + program.project + ' was successfully created, go inside with \'cd ' + program.project + '\' !');
}
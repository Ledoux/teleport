'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.create = create;
exports.createProject = createProject;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function create() {
  this.getLevelMethod('create')();
  this.consoleInfo('Your teleport create was sucessful !');
}

function createProject() {
  // unpack
  var project = this.project,
      program = this.program;
  // warn

  if (typeof program.project !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please configure --project <your_project_name> in your command');
    return;
  }
  // check if such a project exists already here
  project.dir = _path2.default.join(this.currentDir, program.project);
  this.consoleInfo('wait a second... We create your ' + program.project + ' project !');
  if (_fs2.default.existsSync(project.dir)) {
    this.consoleWarn('There is already a ' + program.project + ' here...');
    process.exit();
  }
  // mkdir the folder app
  _child_process2.default.execSync('mkdir -p ' + program.project);
  // write default package
  this.init();
  // info
  this.consoleInfo('Your ' + program.project + ' was successfully created, go inside with \'cd ' + program.project + '\' !');
}
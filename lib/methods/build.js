'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.build = build;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function build() {
  var project = this.project,
      program = this.program;
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here

  if (program.type === 'localhost') {
    program.type = 'staging';
  }
  var commands = [];
  if (_fs2.default.existsSync(_path2.default.join(project.dir, 'bin/bundle.sh'))) {
    commands.push('cd ' + project.dir + ' && sh bin/bundle.sh');
  }
  commands.push('tpt -e --script build --helper ' + program.helper + ' --type ' + program.type + ' --servers all');
  var command = commands.join(' && ');
  if (program.user === 'me') {
    command = command + ' --ttab true';
  }
  this.consoleInfo('Let\'s build');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
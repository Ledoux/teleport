'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.push = push;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function push() {
  var program = this.program;
  // type is localhost by default, but here we want to deploy
  // so we set actually the default to staging here

  if (program.type === 'localhost') {
    program.type = 'staging';
  }
  var commands = [];
  commands.push('tpt -e --script push --helper ' + program.helper + ' --type ' + program.type + ' --servers all');
  var command = commands.join(' && ');
  if (program.user === 'me') {
    command = command + ' --ttab true';
  }
  this.consoleInfo('Let\'s push');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
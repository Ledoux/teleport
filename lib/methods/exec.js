'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exec = exec;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function exec() {
  var app = this.app,
      program = this.program;

  if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that');
    return;
  }
  var command = program.lang === 'py' ? 'python ' + app.pythonDir + ' ' + program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ') : this[program.method]();
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
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
      program = this.program,
      server = this.server,
      type = this.type;

  var command = void 0;
  // execute a script
  if (typeof program.script !== 'undefined' && server) {
    var script = program.script;
    if (type) {
      script = type.name + '_' + script;
    }
    command = 'cd ' + server.dir + ' && sh scripts/' + script + '.sh';
  } else if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that');
    return;
    // execute a command
  } else {
    command = program.lang === 'py' ? 'python ' + app.pythonDir + ' ' + program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ') : this[program.method]();
  }
  if (program.ttab === 'true') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleInfo('Let\'s exec this command !');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
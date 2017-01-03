'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exec = exec;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function exec() {
  var app = this.app,
      program = this.program,
      server = this.server,
      type = this.type;

  var command = void 0,
      scriptFile = void 0;
  // execute a script
  if (typeof program.script !== 'undefined' && server) {
    var script = program.script;
    if (type) {
      script = type.name + '_' + script;
    }
    // find the file
    var scriptFileDir = _path2.default.join(server.dir, 'scripts', script + '.sh');
    scriptFile = _fs2.default.readFileSync(scriptFileDir).toString('utf-8');
    command = 'cd ' + server.dir + ' && sh scripts/' + script + '.sh';
  } else if (typeof program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that');
    return;
    // execute a command
  } else {
    command = program.lang === 'py' ? 'python ' + app.pythonDir + ' ' + program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ') : this[program.method]();
  }
  // option
  if (program.helper) {
    command = 'export HELPER=' + program.helper + ' && ' + command;
  }
  // venv check
  if (app.venvDir) {
    command = 'source ' + app.venvDir + '/bin/activate && ' + command;
  }
  // ttab check
  if (program.ttab === 'true') {
    command = app.ttabDir + ' "' + command + '"';
  }
  this.consoleInfo('Let\'s exec this command !');
  this.consoleLog(command);
  if (scriptFile) {
    this.consoleInfo('Which corresponds to : ');
    this.consoleLog(scriptFile);
  }
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
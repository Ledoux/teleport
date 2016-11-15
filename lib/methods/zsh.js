'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getZshCommand = getZshCommand;
exports.zsh = zsh;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getZshCommand() {
  this.checkProject();
  var project = this.project,
      server = this.server,
      type = this.type,
      run = this.run;

  var command = 'docker ' + type.socket + ' run -t -i ' + run.tag + ' /bin/zsh';
  return ['cd ' + server.dir, command, 'cd ' + project.dir].join(' && ');
}

function zsh() {
  var command = this.getZshCommand();
  this.consoleInfo('Ok we zsh into your container...');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
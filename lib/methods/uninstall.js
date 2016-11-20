'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uninstall = uninstall;
exports.uninstallPythonDependencies = uninstallPythonDependencies;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function uninstall() {
  this.uninstallPythonDependencies();
}

function uninstallPythonDependencies() {
  var project = this.project;

  this.consoleInfo('Let\'s uninstall all in the venv');
  var command = 'source ' + project.config.venv + '/bin/activate && pip freeze | grep -v "^-e" | xargs pip uninstall -y';
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfigureKubernetesCommand = getConfigureKubernetesCommand;
exports.configureKubernetes = configureKubernetes;
exports.configure = configure;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getConfigureKubernetesCommand() {
  var backend = this.backend,
      app = this.app;

  var commands = ['cd ' + app.binDir];
  commands.push('export MASTER_SERVER=' + backend.masterServer);
  commands.push('make configure-kubectl');
  return commands.join(' && ');
}

function configureKubernetes() {
  this.consoleInfo('Let\'s configure kubernetes');
  var command = this.getConfigureKubernetesCommand();
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  console.log('kubernetes is configured !');
}

function configure() {
  this.configureKubernetes();
}
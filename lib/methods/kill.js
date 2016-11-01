'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPsDatabaseCommand = getPsDatabaseCommand;
exports.psDatabase = psDatabase;
exports.getKillDatabaseCommand = getKillDatabaseCommand;
exports.killDatabase = killDatabase;
exports.getPsUwsgiCommand = getPsUwsgiCommand;
exports.psUwsgi = psUwsgi;
exports.getKillUwsgiCommand = getKillUwsgiCommand;
exports.getPsGunicornCommand = getPsGunicornCommand;
exports.psGunicorn = psGunicorn;
exports.getKillGunicornCommand = getKillGunicornCommand;
exports.kill = kill;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getPsDatabaseCommand() {
  return 'ps -ax | grep -v grep | grep rethinkdb | awk \'{print $$1}\'';
}

function psDatabase() {
  console.log(_child_process2.default.execSync(this.getPsDatabaseCommand()).toString('utf-8'));
}

function getKillDatabaseCommand() {
  var command = this.getPsDatabaseCommand();
  return command === '' ? '' : 'kill -9 ' + command;
}

function killDatabase() {
  var command = this.getKillDatabaseCommand();
  command === '' ? console.log(_child_process2.default.execSync(command).toString('utf-8')) : console.log('There is no rethink database to kill');
}

function getPsUwsgiCommand() {
  return 'ps aux | grep -ie [u]wsgi | awk \'{print $2}\'';
}

function psUwsgi() {
  var command = this.getPsUwsgiCommand();
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getKillUwsgiCommand() {
  var command = this.psUwsgi();
  return command === '' ? '' : 'kill -9 ' + command.split('\n').slice(0, -1);
}

function getPsGunicornCommand() {
  return 'ps aux | grep -ie [g]unicorn | awk \'{print $2}\'';
}

function psGunicorn() {
  var command = this.getPsGunicornCommand();
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getKillGunicornCommand() {
  var command = this.psGunicorn();
  return command === '' ? '' : 'kill -9 ' + command.split('\n').slice(0, -1);
}

function kill() {
  this.killDatabase();
}
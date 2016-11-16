'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.start = start;
exports.backendStart = backendStart;
exports.startProviders = startProviders;
exports.startProvider = startProvider;
exports.getPsProviderCommand = getPsProviderCommand;
exports.getStartProviderCommand = getStartProviderCommand;
exports.startServers = startServers;
exports.startServer = startServer;
exports.getStartServerCommand = getStartServerCommand;
exports.getOpenServerWindow = getOpenServerWindow;
exports.openServerWindow = openServerWindow;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function start() {
  this.checkProject();
  this.backendStart();
}

function backendStart() {
  this.checkProject();
  var backend = this.backend,
      program = this.program;

  if (!backend) return;
  this.startProviders();
  program.type = 'localhost';
  this.startServers();
}

function startProviders() {
  var program = this.program;

  program.method = 'startProvider';
  this.mapInProviders();
}

function startProvider() {
  this.checkProject();
  var program = this.program,
      provider = this.provider;

  if (!provider) return;
  if (program.data === 'localhost' && _fs2.default.existsSync(provider.startDir)) {
    var psResult = _child_process2.default.execSync(this.getPsProviderCommand()).toString('utf-8');
    if (psResult.trim() === '') {
      _child_process2.default.execSync(this.getStartProviderCommand());
      (0, _utils.sleep)(2000);
    } else {
      console.log(provider.name + ' localhost is already starting');
    }
  }
}

function getPsProviderCommand() {
  return '';
}

function getStartProviderCommand() {
  var app = this.app,
      program = this.program,
      provider = this.provider;

  var command = 'cd ' + provider.dataDir + ' && sh start.sh';
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  return command;
}

function startServers() {
  var program = this.program;

  program.method = 'startServer';
  this.mapInServers();
}

function startServer() {
  this.checkProject();
  var run = this.run,
      server = this.server;

  if (!server) return;
  var command = this.getStartServerCommand();
  this.consoleInfo('Let\'s start the ' + server.name + ' server');
  this.consoleLog(command);
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
  console.log('Go now to http://localhost:' + run.port + ' to see your app');
  // sleep a bit to wait that the server is startning
  (0, _utils.sleep)(3000);
  this.openServerWindow();
}

function getStartServerCommand() {
  var app = this.app,
      program = this.program,
      server = this.server,
      type = this.type;

  var commands = [];
  var fileName = 'localhost_start.sh';
  commands.push('export MODE=' + type.name);
  commands.push('cd ' + server.dir);
  commands.push('sh scripts/' + fileName);
  var command = commands.join(' && ');
  if (program.user === 'me') {
    command = app.ttabDir + ' "' + command + '"';
  }
  return command;
}

function getOpenServerWindow() {
  var run = this.run;

  var url = 'http://localhost:' + run.port;
  return 'open -a Google\\ Chrome \'' + url + '\'';
}

function openServerWindow() {
  var command = this.getOpenServerWindow();
  _child_process2.default.execSync(command);
}
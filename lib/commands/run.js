'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRunRethinkCommand = getRunRethinkCommand;
exports.startDatabase = startDatabase;
exports.getWebrouterBackendDevRunCommand = getWebrouterBackendDevRunCommand;
exports.webrouterBackendDevRun = webrouterBackendDevRun;
exports.getWebrouterBackendProdRunCommand = getWebrouterBackendProdRunCommand;
exports.getWebsocketerBackendProdRunCommand = getWebsocketerBackendProdRunCommand;
exports.setRunOptionsCommand = setRunOptionsCommand;
exports.backendDevRun = backendDevRun;
exports.backendProdRun = backendProdRun;
exports.getOpenWebrouterWindowCommand = getOpenWebrouterWindowCommand;
exports.openWebrouterWindowCommand = openWebrouterWindowCommand;
exports.backendRun = backendRun;
exports.run = run;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var devHosts = ['localhost', ''];

function getRunRethinkCommand() {
  var command = 'cd ' + this.rethinkDbDataDir + ' && rethinkdb';
  if (this.program.user === 'me') {
    command = this.ttabDir + ' "' + command + '"';
  }
  return command;
}

function startDatabase() {
  if (this.program.data === 'localhost') {
    this.databaseState = _child_process2.default.execSync(this.getPsDatabaseCommand()).toString('utf-8');
    if (this.databaseState.trim() === '') {
      _child_process2.default.execSync(this.getRunRethinkCommand());
      (0, _utils.sleep)(2000);
    } else {
      console.log('Rethink localhost is already running');
    }
  }
}

function getWebrouterBackendDevRunCommand() {
  this.checkProject();
  var commands = ['cd ' + this.pythonScriptsDir];
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand);
  }
  commands.push('python manage_webrouter.py runserver');
  var command = commands.join(' && ');
  if (this.program.user === 'me') {
    command = this.ttabDir + ' "' + command + '"';
  }
  return command;
}

function webrouterBackendDevRun() {
  this.checkProject();
  var command = this.getWebrouterBackendDevRunCommand();
  console.log(_child_process2.default.execSync(command).toString('utf-8'));
}

function getWebrouterBackendProdRunCommand() {
  this.checkProject();
  var commands = ['cd ' + this.backendDir];
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand);
  }
  commands.push('uwsgi --ini config/' + this.program.type + '_uwsgi.ini');
  var command = commands.join(' && ');
  if (this.program.user === 'me') {
    command = this.ttabDir + ' "' + command + '"';
  }
}

function getWebsocketerBackendProdRunCommand() {
  this.checkProject();
  var commands = ['cd ' + this.backendDir];
  if (this.runOptionsCommand && this.runOptionsCommand !== '') {
    commands.push(this.runOptionsCommand);
  }
  commands.push('gunicorn -c config/' + this.program.type + '_guwsgi.ini websocketer:app');
  var command = commands.join(' && ');
  if (this.program.user === 'me') {
    command = this.ttabDir + ' "' + command + '"';
  }
}

function setRunOptionsCommand() {
  var _this = this;

  this.checkProject();
  this.runOptionsCommand = Object.keys(this.runConfig).map(function (key) {
    return 'export ' + key + '=' + _this.runConfig[key];
  }).join(' && ');
}

function backendDevRun() {
  this.checkProject();
  this.webrouterBackendDevRun();
  if (this.isWebsocketer) {
    this.websocketerBackendDevRun();
  }
}

function backendProdRun() {
  this.checkProject();
  this.webrouterBackendProdRun();
  if (this.isWebsocketer) {
    this.websocketerBackendProdRun();
  }
  return this;
}

function getOpenWebrouterWindowCommand() {
  return 'open -a Google\\ Chrome \'' + this.runConfig['WEBROUTER_URL'] + '\'';
}

function openWebrouterWindowCommand() {
  var command = this.getOpenWebrouterWindowCommand();
  _child_process2.default.execSync(command);
}

function backendRun() {
  this.checkProject();
  this.runConfig = {
    DATA: this.program.data,
    SITE_NAME: this.siteName,
    SMTP_HOST: this.smtpHost,
    TYPE: this.program.type,
    WEB: this.program.web,
    WEBROUTER_URL: this[this.program.type + 'WebrouterUrl'],
    WEBSOCKETER_URL: this[this.program.type + 'WebsocketerUrl']
  };
  this.setRunOptionsCommand();
  devHosts.includes(this.program.type) ? this.backendDevRun() : this.backendProdRun();
  console.log('Go now to ' + this.runConfig['WEBROUTER_URL'] + ' to see your app');
  // sleep a bit to wait that the server is running
  (0, _utils.sleep)(2000);
  this.openWebrouterWindowCommand();
}

function run() {
  this.checkProject();
  this.startDatabase();
  this.backendRun();
}
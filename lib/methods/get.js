'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.getConfig = getConfig;
exports.getAppConfig = getAppConfig;
exports.getLevelMethod = getLevelMethod;
exports.getAvailablePorts = getAvailablePorts;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function get() {
  var getValue = this.kwarg === '.' ? this : _lodash2.default.get(this, this.kwarg);
  console.log((0, _jsonStableStringify2.default)(getValue, { space: ' ' }));
}

function getConfig(dir) {
  var _app = this.app,
      configFile = _app.configFile,
      name = _app.package.name;

  var config = void 0;
  // check first for some attributes in package.json
  var localPackage = (0, _utils.getPackage)(dir);
  if (localPackage && localPackage[name]) {
    config = _lodash2.default.merge({}, localPackage[name]);
  }
  // then merge the config if it already exists
  var configDir = _path2.default.join(dir, configFile);
  if (_fs2.default.existsSync(configDir)) {
    config = _lodash2.default.merge(config, JSON.parse(_fs2.default.readFileSync(configDir)));
  }
  // return
  return config;
}

function getAppConfig(dir) {
  return JSON.stringify(this.getConfig(this.app.dir), null, 2);
}

function getLevelMethod(command) {
  var methodName = '' + command + (0, _utils.toTitleCase)(this.level);
  var method = this[methodName];
  if (typeof method === 'undefined') {
    this.consoleError('Sorry there is no such ' + methodName + ' method');
    process.exit();
  }
  return method;
}

function getAvailablePorts(docker) {
  var run = this.run;

  docker = docker || run.docker;
  this.checkWeb();
  var app = this.app;

  var command = 'python ' + app.pythonBinDir + ' ports --filter available --docker ' + docker;
  var rep = _child_process2.default.execSync(command).toString('utf-8');
  var ports = JSON.parse('[' + rep.split('[').slice(-1)[0]);
  return ports;
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // regeneratorRuntime is needed for async await


require('babel-polyfill');

require('colors');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var globalCommands = ['configure', 'create', 'exec', 'deploy', 'init', 'install', 'kill', 'log', 'run'];
var globalModules = globalCommands.map(function (command) {
  return require('./commands/' + command);
});

var Teleport = function () {
  function Teleport(program) {
    var _this = this;

    _classCallCheck(this, Teleport);

    // bind methods from sub modules
    globalModules.forEach(function (module) {
      return Object.keys(module).forEach(function (key) {
        return _this[key] = module[key].bind(_this);
      });
    });
    // call init
    this.init(program);
  }

  _createClass(Teleport, [{
    key: 'start',
    value: function start() {
      // welcome
      console.log('\n\n** Welcome to teleport node-side ! **\n'.bold);
      // unpack
      var program = this.program;
      // we can pass args to the cli, either object, or direct values or nothing

      this.kwarg = null;
      if (typeof program.kwarg === 'string') {
        this.kwarg = program.kwarg[0] === '{' ? JSON.parse(program.kwarg) : program.kwarg;
      }
      // it is maye a generic global task
      var programmedCommand = globalCommands.find(function (command) {
        return program[command];
      });
      if (this[programmedCommand]) {
        this[programmedCommand]();
        return;
      }
      // default return
      this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !');
    }
  }, {
    key: 'getConfig',
    value: function getConfig(dir) {
      var name = this.app.package.name;

      var config = void 0;
      // check first for some attributes in package.json
      var localPackage = (0, _utils.getPackage)(dir);
      if (localPackage && localPackage[name]) {
        config = (0, _lodash.merge)({}, localPackage[name]);
      }
      // then merge the config if it already exists
      var configDir = _path2.default.join(dir, '.' + name + '.json');
      if (_fs2.default.existsSync(configDir)) {
        config = (0, _lodash.merge)(config, JSON.parse(_fs2.default.readFileSync(configDir)));
      }
      // return
      return config;
    }
  }, {
    key: 'checkProject',
    value: function checkProject() {
      if (typeof this.project.dir !== 'string') {
        this.consoleWarn('you need to go inside a project for this command');
        process.exit();
      }
    }
  }, {
    key: 'checkWeb',
    value: function checkWeb() {
      if (this.program.web === 'off') {
        this.consoleError('you need to have internet for this');
        process.exit();
      }
    }
  }, {
    key: 'consoleLog',
    value: function consoleLog(string) {
      console.log(string.blue);
    }
  }, {
    key: 'consoleInfo',
    value: function consoleInfo(string) {
      console.log(string.green);
    }
  }, {
    key: 'consoleWarn',
    value: function consoleWarn(string) {
      console.warn(string.yellow);
    }
  }, {
    key: 'consoleError',
    value: function consoleError(string) {
      console.error(string.red);
    }
  }]);

  return Teleport;
}();

exports.default = Teleport;
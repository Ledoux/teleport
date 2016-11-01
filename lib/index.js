'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // regeneratorRuntime is needed for async await


require('babel-polyfill');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var methods = ['add', 'console', 'check', 'create', 'deploy', 'exec', 'get', 'init', 'install', 'kill', 'log', 'map', 'read', 'set', 'start', 'status', 'write'];
var subModules = methods.map(function (method) {
  return require('./methods/' + method);
});

var Teleport = function () {
  function Teleport(program) {
    var _this = this;

    _classCallCheck(this, Teleport);

    // welcome
    console.log('\n\n** Welcome to teleport node-side ! **\n'.bold);
    // bind methods from sub modules
    subModules.forEach(function (module) {
      return Object.keys(module).forEach(function (key) {
        return _this[key] = module[key].bind(_this);
      });
    });
    // call init
    this.init(program);
  }

  _createClass(Teleport, [{
    key: 'launch',
    value: function launch() {
      // unpack
      var program = this.program;
      // we can pass args to the cli, either object, or direct values or nothing

      this.kwarg = null;
      if (typeof program.kwarg === 'string') {
        this.kwarg = program.kwarg[0] === '{' ? JSON.parse(program.kwarg) : program.kwarg;
      }
      // it is maye a generic global task
      var programmedMethod = methods.find(function (method) {
        return program[method];
      });
      if (this[programmedMethod]) {
        this[programmedMethod]();
        return;
      }
      // default return
      this.consoleWarn('Welcome to teleport... But you didn\'t specify any particular command !');
    }
  }, {
    key: 'pass',
    value: function pass() {}
  }]);

  return Teleport;
}();

exports.default = Teleport;
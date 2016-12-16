'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // regeneratorRuntime is needed for async await


require('babel-polyfill');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var methods = ['build', 'configure', 'connect', 'console', 'check', 'create', 'deploy', 'dump', 'exec', 'get', 'init', 'install', 'kill', 'log', 'map', 'push', 'read', 'replace', 'set', 'start', 'status', 'uninstall', 'watch', 'write', 'zsh'];
var subModules = methods.map(function (method) {
  return require('./methods/' + method);
});
var collectionNames = ['servers', 'types'];

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
    this.program = program;
    var app = this.app = {};
    this.setAppEnvironment();
    this.level = null; // has to be after either scope or project
    var project = this.project = {};
    // determine where we are
    this.currentDir = process.cwd();
    // if we are inside of the app folder itself better is to leave, because
    // we don't have anything to do here
    this.isAppDir = this.currentDir === app.dir.replace(/\/$/, '');
    if (this.isAppDir) {
      this.consoleWarn('You are in the ' + app.package.name + ' folder... Better is to exit :)');
      process.exit();
    }
    // if we want to create something, then we return because we are not in a scope or in a project yet
    if (typeof program.create !== 'undefined') {
      this.level = ['project'].find(function (level) {
        return program[level];
      });
      return;
    }
    // if it is not a create method, it means that we are either in a scope or in a
    // project to do something
    this.currentConfig = this.getConfig(this.currentDir);
    // split given where we are
    if (this.currentConfig || typeof this.program.init !== 'undefined') {
      this.level = 'project';
      project.dir = this.currentDir;
      this.setProjectEnvironment();
    }
    // exit else
    if (!this.level) {
      // this.consoleWarn('You neither are in a scope folder or in a project folder')
      this.consoleWarn('You are not in a project folder');
      process.exit();
    }
  }

  _createClass(Teleport, [{
    key: 'launch',
    value: function launch() {
      var _this2 = this;

      // unpack
      var program = this.program;
      // we can pass args to the cli, either object, or direct values or nothing

      this.kwarg = null;
      if (typeof program.kwarg === 'string') {
        this.kwarg = program.kwarg[0] === '{' ? JSON.parse(program.kwarg) : program.kwarg;
      }
      // it is maybe a generic global task
      var programmedMethod = methods.find(function (method) {
        return program[method];
      });
      if (this[programmedMethod]) {
        // check for mapping ? let's see if there is already a collections
        // arg defined
        if (typeof program.collections === 'undefined') {
          var _ret = function () {
            // so there is no clear mapping to collections
            // but maybe there are some pluralized args
            // suggesting that the method has to be done
            // with a map protocol
            var collectionSlugs = [];
            collectionNames.forEach(function (collectionName) {
              var value = program[collectionName];
              if (typeof value === 'string') {
                if (value === 'all') {
                  collectionSlugs.push(collectionName + 'ByName');
                } else {
                  collectionSlugs.push(collectionName + 'ByName[' + value + ']');
                }
              }
            });
            var collections = collectionSlugs.join('|');
            // if collections is not empty, so yes, it is mapping
            // method request, do it and return in that case
            if (collections !== '') {
              program.collections = collections;
              program.method = programmedMethod;
              _this2.map();
              return {
                v: void 0
              };
            }
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
        // if no collection, it is a simple unit call
        // call it
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
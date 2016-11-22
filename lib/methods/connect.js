'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connect = connect;
exports.connectPorts = connectPorts;

var _lodash = require('lodash');

function connect() {
  this.connectPorts();
}

function connectPorts() {
  var _this = this;

  this.checkProject();
  this.checkWeb();
  var _project = this.project,
      config = _project.config,
      dir = _project.dir;

  this.availablePortsBySubDomain = {};
  (0, _lodash.values)(config.typesByName).forEach(function (type) {
    if (type.subDomain) {
      _this.availablePortsBySubDomain[type.subDomain] = _this.getAvailablePorts(type.subDomain);
    }
  });
  if (config.backend && config.backend.serversByName) {
    Object.keys(config.backend.serversByName).forEach(function (serverName, index) {
      var server = config.backend.serversByName[serverName];
      Object.keys(config.typesByName).forEach(function (typeName) {
        var run = server.runsByTypeName[typeName];
        if (typeof run === 'undefined') {
          run = server.runsByTypeName[typeName] = {};
        }
        var subDomain = run.subDomain || config.typesByName[typeName].subDomain;
        if (typeof subDomain === 'undefined') {
          return;
        }
        if (_this.availablePortsBySubDomain[subDomain]) {
          var availablePorts = _this.availablePortsBySubDomain[subDomain];
          if (availablePorts.length < 1) {
            _this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.');
            process.exit();
          }
          run.port = availablePorts[0].toString();
          _this.availablePortsBySubDomain[subDomain] = availablePorts.slice(1);
        }
      });
    });
  }
  this.writeConfig(dir, config);
}
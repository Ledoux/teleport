'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeConfig = writeConfig;
exports.write = write;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function writeConfig(dir, config) {
  var configFile = this.app.configFile;

  _fs2.default.writeFileSync(_path2.default.join(dir, configFile), (0, _jsonStableStringify2.default)(config, { space: '\t' }));
}

function write(level) {
  if (level) {
    this.writeConfig(level.dir, level.config);
    (0, _utils.writeGitignore)(level.dir, level.gitignore);
    (0, _utils.writeRequirements)(level.dir, level.config.requirements);
    (0, _utils.writePackage)(level.dir, level.package);
  }
}
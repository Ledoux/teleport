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

  var fileDir = _path2.default.join(dir, configFile);
  var fileString = (0, _jsonStableStringify2.default)(config, { space: '\t' });
  _fs2.default.writeFileSync(fileDir, fileString);
}

function write(level) {
  if (level) {
    if (typeof level.dir !== 'string') {
      this.consoleError('level.dir is not correct to write something !');
      return;
    }
    this.writeConfig(level.dir, level.config);
    (0, _utils.writeGitignore)(level.dir, level.gitignores);
    (0, _utils.writeRequirements)(level.dir, level.requirements);
    (0, _utils.writePackage)(level.dir, level.package);
  } else {
    this.consoleWarn('You didn\'t mention a level where to write');
  }
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read = read;

var _utils = require('../utils');

function read(level) {
  if (level) {
    level.config = this.getConfig(level.dir);
    level.gitignore = (0, _utils.getGitignore)(level.dir);
    level.package = (0, _utils.getPackage)(level.dir);
  }
}
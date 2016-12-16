'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read = read;

var _utils = require('../utils');

function read(level) {
  if (level) {
    level.config = this.getConfig(level.dir);
    level.gitignores = (0, _utils.getGitignores)(level.dir);
    level.package = (0, _utils.getPackage)(level.dir);
    level.requirements = (0, _utils.getRequirements)(level.dir);
  }
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.status = status;
function status() {
  var app = this.app;

  this.consoleInfo('App status');
  var appConfig = this.getConfig(app.dir);
  this.consoleConfig(appConfig);
  this.consoleInfo(this.level + ' status');
  var levelConfig = this.getConfig(this[this.level].dir);
  this.consoleConfig(levelConfig);
}
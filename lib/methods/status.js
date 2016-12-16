'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.status = status;
function status() {
  var app = this.app;

  this.consoleInfo('App status');
  this.consoleConfig(app.config);
  this.consoleInfo(this.level + ' status');
  this.consoleConfig(this[this.level].config);
}
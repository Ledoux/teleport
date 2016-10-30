'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = log;
function log() {
  if (typeof this.program.method !== 'string') {
    this.consoleWarn('You need to mention a method with the --method option');
    return;
  }
  var log = this[this.program.method](this.kwarg);
  this.consoleLog(log);
}
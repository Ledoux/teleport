'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.consoleLog = consoleLog;
exports.consoleInfo = consoleInfo;
exports.consoleConfig = consoleConfig;
exports.consoleWarn = consoleWarn;
exports.consoleError = consoleError;

require('colors');

function consoleLog(string) {
  console.log(string.blue);
}

function consoleInfo(string) {
  console.log(string.green);
}

function consoleConfig(object) {
  console.log(JSON.stringify(object, null, 2));
}
function consoleWarn(string) {
  console.warn(string.yellow);
}

function consoleError(string) {
  console.error(string.red);
}
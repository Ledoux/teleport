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
  if (string) {
    console.log(string.blue);
  } else {
    console.warn('your string to console is not correct: ' + string);
  }
}

function consoleInfo(string) {
  if (string) {
    console.log(string.green);
  } else {
    console.warn('your string to console is not correct: ' + string);
  }
}

function consoleConfig(object) {
  console.log(JSON.stringify(object, null, 2));
}
function consoleWarn(string) {
  if (string) {
    console.warn(string.yellow);
  } else {
    console.warn('your string to console is not correct: ' + string);
  }
}

function consoleError(string) {
  if (string) {
    console.error(string.red);
  }
}
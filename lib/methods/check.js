'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkScope = checkScope;
exports.checkProject = checkProject;
exports.checkWeb = checkWeb;
function checkScope() {
  if (typeof this.scope.dir !== 'string') {
    this.consoleWarn('you need to go inside a scope for this command');
    process.exit();
  }
}

function checkProject() {
  if (typeof this.project.dir !== 'string') {
    this.consoleWarn('you need to go inside a project for this command');
    process.exit();
  }
}

function checkWeb() {
  if (this.program.web === 'off') {
    this.consoleError('you need to have internet for this');
    process.exit();
  }
}
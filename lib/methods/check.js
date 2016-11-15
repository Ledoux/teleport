'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkProject = checkProject;
exports.checkWeb = checkWeb;
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
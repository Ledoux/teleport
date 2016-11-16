'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init() {
  var program = this.program,
      project = this.project;
  // name

  var name = program.project || project.dir.split('/').slice(-1)[0];
  // dirs
  var binDir = _path2.default.join(project.dir, 'bin');
  var nodeModulesDir = _path2.default.join(project.dir, 'node_modules');
  var yarnDir = _path2.default.join(project.dir, 'yarn.lock');
  // exec
  _child_process2.default.execSync('mkdir -p ' + binDir + ' && rm -rf ' + nodeModulesDir + ' && rm -f ' + yarnDir);
  // package
  project.package = Object.assign({
    name: name,
    version: '0.0.1'
  }, project.package);
  (0, _utils.writePackage)(project.dir, project.package);
  // config
  var templatesOption = this.getTemplatesOption();
  project.config = Object.assign({}, project.config);
  project.config.templateNames = this.getTemplateNames();
  project.allTemplateNames = this.getAllTemplateNames();
  this.writeConfig(project.dir, project.config);
  // gitignore
  project.gitignores = ['node_modules', '*.pyc', 'venv'];
  (0, _utils.writeGitignore)(project.dir, project.gitignores);
  // requirements
  project.requirements = ['click==5.1'];
  (0, _utils.writeRequirements)(project.dir, project.requirements);
  // write a configure file
  var configureFileDir = _path2.default.join(binDir, 'configure.sh');
  var configureFileString = templatesOption !== ''
  // ? `npm install --save-dev ${templatesOption}`
  ? 'yarn add --dev ' + templatesOption : '';
  _fs2.default.writeFileSync(configureFileDir, configureFileString);
  // write an install file
  var installFileDir = _path2.default.join(binDir, 'install.sh');
  var installFileString = 'yarn';
  _fs2.default.writeFileSync(installFileDir, installFileString);
  // configure
  this.setProjectEnvironment();
  this.configure();
  // dump
  this.dump();
}
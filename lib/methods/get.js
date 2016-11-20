'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.get = get;
exports.getConfig = getConfig;
exports.getAppConfig = getAppConfig;
exports.getLevelMethod = getLevelMethod;
exports.getAvailablePorts = getAvailablePorts;
exports.getTemplatesOption = getTemplatesOption;
exports.getTemplateNames = getTemplateNames;
exports.getDepTemplateNames = getDepTemplateNames;
exports.getAllTemplateNames = getAllTemplateNames;
exports.getTemplateDependencies = getTemplateDependencies;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function get() {
  var getValue = this.kwarg === '.' ? this : _lodash2.default.get(this, this.kwarg);
  console.log((0, _jsonStableStringify2.default)(getValue, { space: ' ' }));
}

function getConfig(dir) {
  var _app = this.app,
      configFile = _app.configFile,
      name = _app.package.name;

  var config = void 0;
  // check first for some attributes in package.json
  var localPackage = (0, _utils.getPackage)(dir);
  if (localPackage && localPackage[name]) {
    config = _lodash2.default.merge({}, localPackage[name]);
  }
  // then merge the config if it already exists
  var configDir = _path2.default.join(dir, configFile);
  if (_fs2.default.existsSync(configDir)) {
    config = _lodash2.default.merge(config, JSON.parse(_fs2.default.readFileSync(configDir)));
  }
  // return
  return config;
}

function getAppConfig(dir) {
  return JSON.stringify(this.getConfig(this.app.dir), null, 2);
}

function getLevelMethod(command) {
  var methodName = '' + command + (0, _utils.toTitleCase)(this.level);
  var method = this[methodName];
  if (typeof method === 'undefined') {
    this.consoleError('Sorry there is no such ' + methodName + ' method');
    process.exit();
  }
  return method;
}

function getAvailablePorts(docker) {
  var run = this.run;

  docker = docker || run.docker;
  this.checkWeb();
  var app = this.app;

  var command = 'python ' + app.pythonDir + ' ports --filter available --docker ' + docker;
  var rep = _child_process2.default.execSync(command).toString('utf-8');
  var ports = JSON.parse('[' + rep.split('[').slice(-1)[0]);
  return ports;
}

function getTemplatesOption() {
  var project = this.project,
      program = this.program;

  var templatesOption = '';
  if (typeof program.templates !== 'undefined' && program.templates.trim() !== '') {
    templatesOption = program.templates.split(',').join(' ');
  } else if (project.config && project.config.templateNames) {
    templatesOption = project.config.templateNames.join(' ');
  }
  return templatesOption;
}

function getTemplateNames() {
  var templatesOption = this.getTemplatesOption();
  return templatesOption.split(' ').map(function (template) {
    return template.split('@')[0];
  }).filter(function (templateName) {
    return templateName.trim() !== '';
  });
}

function getDepTemplateNames(templateName) {
  var _this = this;

  var depTemplateNames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var project = this.project;

  depTemplateNames.push(templateName);
  var templateDir = _path2.default.join(project.dir, 'node_modules', templateName);
  var templateConfig = this.getConfig(templateDir);
  // make sure we have the node_module
  if (typeof templateConfig === 'undefined') {
    var command = 'yarn add --dev ' + templateName;
    // command = `npm install --save-dev ${templateName}`
    _child_process2.default.execSync(command);
  }
  templateConfig = this.getConfig(templateDir);
  var templatePackage = (0, _utils.getPackage)(templateDir);
  var dependencies = Object.assign({}, templatePackage.dependencies, templatePackage.devDependencies);
  Object.keys(dependencies).forEach(function (depTemplateName) {
    return _this.getDepTemplateNames(depTemplateName, depTemplateNames);
  });
  return depTemplateNames;
}

function getAllTemplateNames() {
  var _this2 = this;

  var templateNames = this.project.config.templateNames;

  return _lodash2.default.uniq(_lodash2.default.flatten(templateNames.map(function (templateName) {
    return _this2.getDepTemplateNames(templateName);
  })));
}

function getTemplateDependencies() {
  var _project = this.project,
      config = _project.config,
      dir = _project.dir;

  return _lodash2.default.fromPairs(config.templateNames.map(function (template) {
    var _template$split = template.split('@'),
        _template$split2 = _slicedToArray(_template$split, 2),
        templateName = _template$split2[0],
        templateVersion = _template$split2[1];

    var templateDir = _path2.default.join(dir, 'node_modules', templateName);
    templateVersion = templateVersion || (0, _utils.getPackage)(templateDir).version;
    return [templateName, templateVersion];
  }));
}
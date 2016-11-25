'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replace = replace;
exports.replaceProject = replaceProject;
exports.replacePlaceholderFiles = replacePlaceholderFiles;
exports.replacePlaceholderFile = replacePlaceholderFile;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var notLocalhostPlaceholderFiles = ['build.sh', 'controller.yaml', 'deploy.sh', 'Dockerfile', 'push.sh', 'run.sh', 'service.yaml'];
var templatePrefix = '_p_';

function replace() {
  this.replaceProject();
  this.consoleInfo('Your teleport replace was sucessful !');
}

function replaceProject() {
  var project = this.project;
  // boilerplate

  this.setAllTypesAndServersEnvironment();
  this.replacePlaceholderFiles();
  // info
  this.consoleInfo('Your ' + project.package.name + ' project was successfully replaced!');
}

function replacePlaceholderFiles() {
  var _this = this;

  var program = this.program;

  this.setAllTypesAndServersEnvironment();
  program.image = undefined;
  program.method = null;
  program.methods = ['service.yaml', 'controller.yaml', 'client_secret.json', 'guwsgi.ini', 'uwsgi.ini', 'guwsgi.ini'].map(function (file) {
    return {
      folder: 'config',
      file: file
    };
  }).concat(['build.sh', 'deploy.sh', 'install.sh', 'push.sh', 'run.sh', 'start.sh'].map(function (file) {
    return {
      folder: 'scripts',
      file: file
    };
  })).concat(['Dockerfile'].map(function (file) {
    return {
      folder: 'server',
      file: file
    };
  })).map(function (newProgram) {
    return function () {
      Object.assign(program, newProgram);
      _this.replacePlaceholderFile();
    };
  });
  this.mapInTypesAndServers();
}

function replacePlaceholderFile() {
  this.checkProject();
  var backend = this.backend,
      program = this.program,
      project = this.project,
      run = this.run,
      server = this.server,
      type = this.type;
  // connect if no port was set here

  if (type.name !== 'localhost' && typeof run.port === 'undefined') {
    this.connect();
  }
  // check
  if (!backend || !run || !server || !type || type.name === 'localhost' && notLocalhostPlaceholderFiles.includes(program.file)) {
    return;
  }
  // set the file name
  var installedFileName = program.file;
  if (type) {
    installedFileName = type.name + '_' + installedFileName;
  }
  // look first if there is no specific <type>_<script> in a certain template
  var templateFileDir = null;
  // get all templates
  var allTemplateNames = this.getAllTemplateNames();
  var foundTemplateName = allTemplateNames.find(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    var templateServerDir = _path2.default.join(templateDir, 'backend/servers', server.name);
    var templateFolderDir = program.folder === 'server' ? templateServerDir : _path2.default.join(templateServerDir, program.folder);
    var templateFileName = installedFileName;
    templateFileName = '' + templatePrefix + templateFileName;
    templateFileDir = _path2.default.join(templateFolderDir, templateFileName);
    if (_fs2.default.existsSync(templateFileDir)) return true;
    // remove the type prefix then to find a general <script> template
    templateFileName = '' + templatePrefix + program.file;
    templateFileDir = _path2.default.join(templateFolderDir, templateFileName);
    return _fs2.default.existsSync(templateFileDir);
  });
  if (!templateFileDir || typeof foundTemplateName === 'undefined') return;
  var templateFile = _fs2.default.readFileSync(templateFileDir, 'utf-8');
  var installedFolderDir = program.folder === 'server' ? server.dir : _path2.default.join(server.dir, program.folder);
  var installedFileDir = _path2.default.join(installedFolderDir, installedFileName);
  // ok for now if the file already exists and that we are not in the force mode, leave
  if (_fs2.default.existsSync(installedFileDir) && program.force !== 'true') {
    return;
  }
  // prepare the dockerExtraConfig
  var extraConfig = Object.assign({
    'DOCKER_HOST': run.host,
    'PORT': run.port,
    'SITE_NAME': backend.siteName,
    'TYPE': type.name,
    'URL': run.url,
    'WEB': 'on'
  }, backend.dockerEnv, server.dockerEnv);
  this.dockerExtraConfig = Object.keys(extraConfig).map(function (key) {
    return 'ENV ' + key + ' ' + extraConfig[key];
  }).join('\n');
  this.manageExtraConfig = Object.keys(extraConfig).map(function (key) {
    return 'export ' + key + '=' + extraConfig[key];
  }).join(' && ');
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = this.manageExtraConfig + ' &&';
  }
  // info
  this.consoleInfo('Let\'s install this placeholder file ' + installedFileDir);
  // replace
  _fs2.default.writeFileSync(installedFileDir, (0, _utils.formatString)(templateFile, this));
}
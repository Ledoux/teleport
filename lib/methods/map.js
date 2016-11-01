'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.map = map;
exports.mapInServers = mapInServers;
exports.mapInProviders = mapInProviders;
exports.mapInTypesAndServers = mapInTypesAndServers;

var _lodash = require('lodash');

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// this function is kind of usefult to apply a function among different
// set of program attributes, bases on some entities name different sets
function map() {
  var _this = this;

  var program = this.program;
  // get the method, either it is a string and we need to get it, either
  // it is already the method

  var methods = (program.method ? [typeof program.method === 'string' ? this[program.method] : program.method] : this.program.methods.map(function (method) {
    return typeof method === 'string' ? _this[method] : method;
  })).filter(function (method, index) {
    var isDefined = typeof method !== 'undefined';
    if (!isDefined) {
      _this.consoleWarn('no such method ' + _this.program.methods[index]);
    }
    return isDefined;
  });
  // get the collection slugs
  var collectionSlugs = program.collections.split(',');
  // get all the cartesian products
  var names = collectionSlugs.map(function (collectionName) {
    var key = collectionName + 'ByName';
    var collection = (0, _lodash.get)(_this, key);
    return Object.keys(collection || {});
  });
  var pairs = _utils.getCartesianProduct.apply(undefined, _toConsumableArray(names));
  // get the program singular names
  var singularNames = collectionSlugs.map(function (collectionSlug) {
    return (0, _pluralize2.default)(collectionSlug.split('.').slice(-1)[0], 1);
  });
  var titleSingularNames = singularNames.map(_utils.toTitleCase);
  // get the env methods
  var environmentMethods = titleSingularNames.map(function (titleSingularName) {
    return _this['set' + titleSingularName + 'Environment'];
  });
  // set the program for each case and call the method
  pairs.forEach(function (pair) {
    // set env
    singularNames.forEach(function (singularName, index) {
      program[singularName] = pair[index];
    });
    environmentMethods.forEach(function (environmentMethod) {
      return environmentMethod();
    });
    // call the method
    methods.forEach(function (method) {
      return method();
    });
  });
}

function mapInServers() {
  var program = this.program;

  program.collections = 'project.config.backend.servers';
  this.map();
}

function mapInProviders() {
  var program = this.program;

  program.collections = 'project.config.backend.providers';
  this.map();
}

function mapInTypesAndServers() {
  var program = this.program;

  program.collections = 'project.config.types,project.config.backend.servers';
  this.map();
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sleep = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var sleep = exports.sleep = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(milliseconds) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new Promise(function () {
              return setimeOut(function () {}, milliseconds);
            });

          case 2:
            return _context.abrupt('return', _context.sent);

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function sleep(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.toTitleCase = toTitleCase;
exports.toDashCase = toDashCase;
exports.toCapitalUnderscoreCase = toCapitalUnderscoreCase;
exports.formatString = formatString;
exports.getGitignores = getGitignores;
exports.getPackage = getPackage;
exports.getRequirements = getRequirements;
exports.getSecret = getSecret;
exports.writePackage = writePackage;
exports.writeGitignore = writeGitignore;
exports.writeRequirements = writeRequirements;
exports.getCartesianProduct = getCartesianProduct;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function toTitleCase(string) {
  return string.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function toDashCase(string) {
  return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCapitalUnderscoreCase(string) {
  return string.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toUpperCase();
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
function formatString(input, context) {
  var replacer = function replacer(context) {
    return function (string) {
      // remove $( and )
      var slug = string.slice(2, -1);
      return (0, _lodash.get)(context, slug);
    };
  };
  return function (input, context) {
    return input.replace(/\$\([^$()]+\)/g, replacer(context));
  }(input, context);
}

function getGitignores(dir) {
  var fileDir = _path2.default.join(dir, '.gitignore');
  if (_fs2.default.existsSync(fileDir)) {
    var _ret = function () {
      var gitignores = [];
      _fs2.default.readFileSync(fileDir).toString('utf-8').split('\n').forEach(function (word) {
        gitignores.push(word);
      });
      return {
        v: gitignores
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
}

function getPackage(dir) {
  var fileDir = _path2.default.join(dir, 'package.json');
  if (_fs2.default.existsSync(fileDir)) {
    return JSON.parse(_fs2.default.readFileSync(fileDir));
  }
}

function getRequirements(dir) {
  var fileName = 'requirements.txt';
  var fileDir = _path2.default.join(dir, fileName);
  if (_fs2.default.existsSync(fileDir)) {
    var _ret2 = function () {
      var requirements = [];
      _fs2.default.readFileSync(fileDir).toString('utf-8').split('\n').forEach(function (word) {
        requirements.push(word);
      });
      return {
        v: requirements
      };
    }();

    if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
  }
}

function getSecret(dir) {
  var fileName = 'secret.json';
  var fileDir = _path2.default.join(dir, fileName);
  if (_fs2.default.existsSync(fileDir)) {
    return JSON.parse(_fs2.default.readFileSync(fileDir));
  }
}

function writePackage(dir, writtenPackage) {
  var fileDir = _path2.default.join(dir, 'package.json');
  var fileString = (0, _jsonStableStringify2.default)(writtenPackage, { space: '\t' });
  _fs2.default.writeFileSync(fileDir, fileString);
}

function writeGitignore(dir, writtenGitignores) {
  var fileDir = _path2.default.join(dir, '.gitignore');
  var fileString = writtenGitignores.join('\n');
  _fs2.default.writeFileSync(fileDir, fileString);
}

function writeRequirements(dir, writtenRequirements) {
  if (writtenRequirements) {
    var fileName = 'requirements.txt';
    var fileDir = _path2.default.join(dir, fileName);
    var fileString = writtenRequirements.join('\n');
    _fs2.default.writeFileSync(fileDir, fileString);
  }
}

function getCartesianProduct() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return args.reduce(function (a, b) {
    return (0, _lodash.flatten)(a.map(function (x) {
      return b.map(function (y) {
        return x.concat([y]);
      });
    }), true);
  }, [[]]);
}
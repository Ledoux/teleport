'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sleep = undefined;

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
exports.formatString = formatString;
exports.getPackage = getPackage;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function toTitleCase(string) {
  return string.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
function formatString() {
  var replacer = function replacer(context) {
    return function (s, name) {
      return context[name];
    };
  };
  return function (input, context) {
    return input.replace(/\$\((\w+)\)/g, replacer(context));
  };
}

function getPackage(dir) {
  var packageDir = _path2.default.join(dir, 'package.json');
  if (_fs2.default.existsSync(packageDir)) {
    return JSON.parse(_fs2.default.readFileSync(packageDir));
  }
}
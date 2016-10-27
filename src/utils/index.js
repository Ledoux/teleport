module.exports.toTitleCase = function (string) {
  return string.replace(/\w\S*/g,
    function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
module.exports.formatString = (function () {
  var replacer = function (context) {
    return function (s, name) {
      return context[name]
    }
  }
  return function (input, context) {
    return input.replace(/\$\((\w+)\)/g, replacer(context))
  }
})()

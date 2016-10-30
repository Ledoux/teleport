import fs from 'fs'
import path from 'path'

export function toTitleCase (string) {
  return string.replace(/\w\S*/g,
    function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
export function formatString () {
  var replacer = function (context) {
    return function (s, name) {
      return context[name]
    }
  }
  return function (input, context) {
    return input.replace(/\$\((\w+)\)/g, replacer(context))
  }
}

export function getPackage (dir) {
  const packageDir = path.join(dir, 'package.json')
  if (fs.existsSync(packageDir)) {
    return JSON.parse(fs.readFileSync(packageDir))
  }
}

export async function sleep (milliseconds) {
  return await new Promise(() => setimeOut(() => {}, milliseconds))
}

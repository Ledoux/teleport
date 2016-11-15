import fs from 'fs'
import { flatten, get, toPairs } from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

export function toTitleCase (string) {
  return string.replace(/\w\S*/g,
    function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

export function toDashCase (string) {
  return string.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase()
}

export function toCapitalUnderscoreCase (string) {
  return string.replace( /([a-z])([A-Z])/g, '$1_$2' ).replace(/-/g, '_').toUpperCase()
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
export function formatString (input, context) {
  var replacer = function (context) {
    return function (string) {
      // remove $( and )
      const slug = string.slice(2, -1)
      return get(context, slug)
    }
  }
  return (function (input, context) {
    return input.replace(/\$\([^$()]+\)/g, replacer(context))
  })(input, context)
}

export function getPackage (dir) {
  const packageDir = path.join(dir, 'package.json')
  if (fs.existsSync(packageDir)) {
    return JSON.parse(fs.readFileSync(packageDir))
  }
}

export function getGitignores (dir) {
  const fileDir = path.join(dir, '.gitignore')
  if (fs.existsSync(fileDir)) {
    const gitignores = []
    fs.readFileSync(fileDir)
      .toString('utf-8')
      .split('\n')
      .forEach(word => { gitignores.push(word) })
    return gitignores
  }
}

export function getRequirements (dir, prefix) {
  let fileName = 'requirements.txt'
  if (prefix) {
    fileName = `${prefix}_${fileName}`
  }
  const fileDir = path.join(dir, fileName)
  if (fs.existsSync(fileDir)) {
    const requirements = []
    fs.readFileSync(fileDir)
      .toString('utf-8')
      .split('\n')
      .forEach(word => { requirements.push(word) })
    return requirements
  }
}

export async function sleep (milliseconds) {
  return await new Promise(() => setimeOut(() => {}, milliseconds))
}

export function writePackage (dir, writtenPackage) {
  const fileDir = path.join(dir, 'package.json')
  const fileString = stringify(writtenPackage, { space: '\t' })
  fs.writeFileSync(fileDir, fileString)
}

export function writeGitignore (dir, writtenGitignores) {
  const fileDir = path.join(dir, '.gitignore')
  const fileString = writtenGitignores.join('\n')
  fs.writeFileSync(fileDir, fileString)
}

export function writeRequirements (dir, writtenRequirements, prefix) {
  let fileName = 'requirements.txt'
  if (prefix) {
    fileName = `${prefix}_${fileName}`
  }
  const fileDir = path.join(dir, fileName)
  const fileString = writtenRequirements.join('\n')
  fs.writeFileSync(fileDir, fileString)
}

export function getCartesianProduct (...args) {
  return args.reduce((a, b) => {
    return flatten(a.map(x => {
      return b.map(y => {
        return x.concat([y])
      })
    }), true)
  }, [ [] ])
}

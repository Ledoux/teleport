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

export function getGitignore (dir) {
  const gitignoreDir = path.join(dir, '.gitignore')
  if (fs.existsSync(gitignoreDir)) {
    const gitignore = {}
    fs.readFileSync(gitignoreDir)
      .toString('utf-8')
      .split('\n')
      .forEach(word => { gitignore[word] = '' })
    return gitignore
  }
}

export async function sleep (milliseconds) {
  return await new Promise(() => setimeOut(() => {}, milliseconds))
}

export function writePackage (dir, writtenPackage) {
  fs.writeFileSync(path.join(dir, 'package.json'),
  stringify(writtenPackage, { space: '\t' }))
}

export function writeGitignore (dir, writtenGitignore) {
  if (!writtenGitignore || typeof writtenGitignore === 'undefined') {
    this.consoleWarn('writtenGitignore is not yet set')
  }
  fs.writeFileSync(path.join(dir, '.gitignore'),
    Object.keys(writtenGitignore).join('\n')
  )
}

export function writeRequirements (dir, writtenRequirements) {
  const requirementsText = toPairs(writtenRequirements).map(pairs => {
    const [requirement, version] = pairs
    return `${requirement}==${version}`
  }).join('\n')
  fs.writeFileSync(path.join(dir, 'requirements.txt'), requirementsText)
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

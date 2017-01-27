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

// this method helps to have all the matches given a regexp and an input string
export function getMatches (re, input) {
  let m
  const matches = []
  // first we need to know how many capturing groups we want
  const count = Math.max(0, String(re).split('(.*)').length - 1)
  // then we extract while the pointer has not reached the end of the string
  do {
    m = re.exec(input)
    if (m) {
      matches.push(m.slice(0, count + 1))
    }
  } while (m)
  return matches
}

export function getForMatches (input) {
  return getMatches(/\$\[for\s+(.*)\s+in\s+(.*)\]\s+(.*)\n/g, input)
}

// from http://stackoverflow.com/questions/4920383/javascript-string-replace
export function formatString (input, context) {
  let replacedInput = input
  // first we need to scrap the for local variables and add them to the context
  const forMatches = getForMatches(input)
  forMatches.forEach(forMatch => {
    const array = get(context,forMatch[2])
    const lines = array.map(element => {
      const re = new RegExp(`\\$\\[\\[${forMatch[1]}\\]\\]`,'g')
      return forMatch[3].replace(re, element)
    })
    replacedInput = replacedInput.replace(forMatch[0], lines.join('\n'))
  })
  // Now we replace the variable encapsulated in the $[] placeholders
  // given the context
  const replacer = function (context) {
    return function (string) {
      // remove $[ and ]
      const slug = string.slice(2, -1)
      return get(context, slug)
    }
  }
  // return
  return (function (input, context) {
    return replacedInput.replace(/\$\[[^$()]+?\]/g, replacer(context))
  })(input, context)
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

export function getPackage (dir) {
  const fileDir = path.join(dir, 'package.json')
  if (fs.existsSync(fileDir)) {
    return JSON.parse(fs.readFileSync(fileDir))
  }
}

export function getRequirements (dir) {
  let fileName = 'requirements.txt'
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

export function getSecret (dir) {
  let fileName = 'secret.json'
  const fileDir = path.join(dir, fileName)
  if (fs.existsSync(fileDir)) {
    return JSON.parse(fs.readFileSync(fileDir))
  }
}

export async function sleep (milliseconds) {
  return await new Promise(() => setTimeout(() => {}, milliseconds))
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

export function writeRequirements (dir, writtenRequirements) {
  if (writtenRequirements) {
    let fileName = 'requirements.txt'
    const fileDir = path.join(dir, fileName)
    const fileString = writtenRequirements.join('\n')
    fs.writeFileSync(fileDir, fileString)
  }
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

function s4 () {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function getRandomId () {
  return s4() + s4()
}

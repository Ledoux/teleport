// MAP UTILITY
// map is not a task. It helps to call a method of Teleport that will be applied
// for each elements defined in the collections arguments.
// For instance 'tpt map --method installServer --collections project.config.backend.serversByName'
// will call the installServer method for each server of the project.
// Going further, 'tpt map --method get --kwarg run --collections
// project.config.typesByName,project.config.backend.serversByName'
// will call the get to display the run object for each cartesian product result
// of from the types and the server arrays

import { get, values } from 'lodash'
import pluralize from 'pluralize'

import { getCartesianProduct, toTitleCase } from '../utils/functions'

export function getArrayFromArrayOrObject (value) {
  return Array.isArray(value)
  ? value
  : values(value)
}

// this method is kind of usefult to apply a function among different
// set of program attributes, bases on some entities name different sets
export function map () {
  // unpack
  const { program } = this
  // check
  if (typeof program.method === 'undefined' || program.methods === 'undefined') {
    this.consoleError('You need to define a method or methods')
  }
  // get the method, either it is a string and we need to get it, either
  // it is already the method
  const methods = (
    program.method
    ? [typeof program.method === 'string' ? this[program.method] : program.method]
    : program.methods.map(method => typeof method === 'string'
      ? this[method]
      : method
    )
  ).filter((method, index) => {
    const isDefined = typeof method !== 'undefined'
    if (!isDefined) {
      this.consoleWarn(`no such method ${program.methods[index]}`)
    }
    return isDefined
  })
  // get the collection slugs
  const collectionSlugs = program.collections.split(',')

  // get the program singular names
  const singularNames = collectionSlugs.map(collectionSlug => {
    let pluralName = collectionSlug.split('.')
                                  .slice(-1)[0]
                                  .split('[')[0]
    if (pluralName.endsWith('ByName')) {
      pluralName = pluralName.slice(0, -6)
    }
    return pluralize(pluralName, 1)
  })
  const titleSingularNames = singularNames.map(toTitleCase)
  // get the env methods
  const environmentMethods = titleSingularNames.map(titleSingularName =>
    this[`set${titleSingularName}Environment`]
  )

  // get all the cartesian products
  const names = collectionSlugs
    .map(collectionSlug => {
      // is the slug an array ?
      if (collectionSlug.slice(-1)[0] === ']') {
        return collectionSlug
                .match(/\[(.*?)\]/g)
                .slice(-1)[0] // take the last match
                .slice(1, -1) // remove [ and ]
                .split(',')
      } else {
        // if not it is an all request
        // const key = `${collectionSlugs}ByName`
        const key = collectionSlug
        // collection = getArrayFromArrayOrObject(get(this, key))
        return Object.keys(get(this, key) || {})
      }
    })

  const pairs = getCartesianProduct(...names)

  // set the program for each case and call the method
  return pairs.map(pair => {
    // set env
    singularNames.forEach((singularName, index) => {
      program[singularName] = pair[index]
    })
    environmentMethods.forEach(environmentMethod => environmentMethod())
    // call the method
    return methods.map(method => method())
  })
}

export function mapInServers () {
  const { program } = this
  program.collections = 'project.config.backend.serversByName'
  this.map()
}

export function mapInProviders () {
  const { program } = this
  program.collections = 'project.config.backend.providersByName'
  this.map()
}

export function mapInTypesAndServers () {
  const { program } = this
  program.collections = 'project.config.typesByName,project.config.backend.serversByName'
  this.map()
}

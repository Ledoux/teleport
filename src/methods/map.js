import { get } from 'lodash'
import pluralize from 'pluralize'

import { getCartesianProduct, toTitleCase } from '../utils'

// this function is kind of usefult to apply a function among different
// set of program attributes, bases on some entities name different sets
export function map () {
  const { program } = this
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
  // get all the cartesian products
  const names = collectionSlugs
    .map(collectionName => {
      const key = `${collectionName}ByName`
      const collection = get(this, key)
      return Object.keys(collection || {})
    })
  const pairs = getCartesianProduct(...names)
  // get the program singular names
  const singularNames = collectionSlugs.map(collectionSlug =>
    pluralize(collectionSlug.split('.').slice(-1)[0], 1)
  )
  const titleSingularNames = singularNames.map(toTitleCase)
  // get the env methods
  const environmentMethods = titleSingularNames.map(titleSingularName =>
    this[`set${titleSingularName}Environment`]
  )
  // set the program for each case and call the method
  pairs.forEach(pair => {
    // set env
    singularNames.forEach((singularName, index) => {
      program[singularName] = pair[index]
    })
    environmentMethods.forEach(environmentMethod => environmentMethod())
    // call the method
    methods.forEach(method => method())
  })
}

export function mapInServers () {
  const { program } = this
  program.collections = 'project.config.backend.servers'
  this.map()
}

export function mapInProviders () {
  const { program } = this
  program.collections = 'project.config.backend.providers'
  this.map()
}

export function mapInTypesAndServers () {
  const { program } = this
  program.collections = 'project.config.types,project.config.backend.servers'
  this.map()
}

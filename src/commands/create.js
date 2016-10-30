import childProcess from 'child_process'
import fs from 'fs'
import { merge, values } from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

import { getPackage, sleep } from '../utils'

export function getCopyTemplatesCommand () {
  const { program: { name, templates }, project } = this
  if (typeof templates !== 'string') {
    this.consoleWarn('You didn\'t mention any particular templates, please add --templates <template1>,<template2>  in your command')
    return
  }
  if (typeof name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command')
    return
  }
  return values(project.templatesByName).map(template =>
    // we exclude package.json and config file because we want to merge them
    `rsync -rv --exclude=package.json --exclude=.${name}.json ${template.dir}/ ${project.dir}`
  ).join(' && ')
}

export function copyTemplates () {
  const { program } = this
  this.consoleInfo(`Let\'s copy the templates in ${program.name}`)
  const command = this.getCopyTemplatesCommand()
  this.consoleLog(command)
  const buffer = childProcess.execSync(command)
  // console.log(buffer.toString('utf-8'))
  // sleep(1000)
}

export function createPackage () {
  const { program, project } = this
  this.consoleInfo(`Let\'s create package in ${program.name}`)
  project.package = merge(
    {
      name: program.name,
      version: '0.0.1'
    },
    ...values(project.templatesByName)
      .map(template => getPackage(template.dir)
    ))
  project.packageDir = path.join(project.dir, 'package.json')
  fs.writeFileSync(project.packageDir, stringify(project.package, {space: '\t'}))
  this.consoleInfo('package written')
}

export function createConfig () {
  const { app, project } = this
  this.consoleInfo(`Let\'s create config in ${project.name}`)
  project.config = merge(
    app.config,
    ...values(project.templatesByName)
      .map(template => this.getConfig(template.dir))
    )
  project.configDir = path.join(project.dir, `.${app.package.name}.json`)
  fs.writeFileSync(project.configDir, stringify(project.config, {space: '\t'}))
  this.consoleInfo('config written')
}

export function getCreateVenvCommand () {
  const { project } = this
  return `cd ${project.name} && virtualenv -p ${project.config.python} venv`
}

export function createVenv () {
  const command = this.getCreateVenvCommand()
  this.consoleInfo('... Installing a python venv for our backend')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function create () {
  const { app, program } = this
  // copy the boilerplate
  if (typeof program.name !== 'string') {
    this.consoleWarn('You didn\'t mention any particular name, please add --name <your_app_name> in your command')
    return
  }
  this.consoleInfo(`wait a second... We create your ${program.name} project !`)
  // env
  const project = this.project = { dir: path.join(process.cwd(), program.name) }
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`There is already a ${program.name} here...`)
    return
  }
  // copy merge from templates
  project.templateNames = program.templates.split(',')
  project.templatesByName = {}
  project.templateNames.forEach(templateName => {
    const appTemplate = app.templatesByName[templateName]
    project.templatesByName[templateName] = appTemplate
  })
  this.copyTemplates()
  // create package config
  this.createPackage()
  this.createConfig()
  // set backend end
  this.setProjectEnvironment()
  // configure
  this.configure()
  // install
  // this.install()
  // console
  this.consoleInfo(`Your ${program.name} was successfully created, go inside with \'cd ${program.name}\' !`)
}

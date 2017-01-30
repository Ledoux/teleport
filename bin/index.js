#!/usr/bin/env node

const program = require('commander')

const Teleport = require('../lib').default

program
  .version(require('../package.json').version)
  // list first all the tasks and sub tasks
  .option('configure', 'Configure')
  .option('-b, build', 'Build')
  .option('-c, create', 'Create')
  .option('-d, deploy', 'Deploy')
  .option('dump', 'Dump')
  .option('init', 'Init')
  .option('-i, install', 'Install')
  .option('-p, push', 'Push')
  .option('replace', 'Replace')
  .option('-r, run', 'Run')
  .option('-s, start', 'Start')

  // list all the utility commands
  .option('-e, exec', 'Exec')
  .option('-g, get', 'Get')
  .option('-m, map', 'Map')

  // list all the options
  .option('--cache [type]', 'Cache', 'true')
  .option('--collections [type]', 'Collections')
  .option('--data [type]', 'Data', 'localhost')
  .option('--file [type]', 'file')
  .option('--folder [type]', 'Folder')
  .option('--force [type]', 'Force', /^(true|false)$/i, 'false')
  .option('--kwarg [type]', 'Kwarg', '')
  .option('--image [type]', 'Image')
  .option('--lang [type]', 'Language', 'js')
  .option('--lib [type]', 'Lib', /^(local|global)$/i, 'local')
  .option('--method [type]', 'Method')
  .option('--name [type]', 'Name')
  .option('--permission [type]', 'Permission', '')
  .option('--pip [type]', 'Pip', /^(true|false)$/i, 'true')
  .option('--platform [type]', 'Platform', 'heroku')
  .option('--run [type]', 'Run')
  .option('--scope [type]', 'Scope')
  .option('--script [type]', 'Script')
  .option('--server [type]', 'Server')
  .option('--servers [type]', 'Servers')
  .option('--shell [type]', 'Shell', /^(concurrently|sync)$/i, 'concurrently')
  .option('--templates [type]', 'Templates')
  .option('--type [type]', 'Type', 'localhost')
  .option('--types [type]', 'Types')
  .option('--venv [type]', 'Venv', /^(true|false)$/i, 'true')

  .option('')

  .parse(process.argv)

const localTeleport = new Teleport(program)

localTeleport.launch()

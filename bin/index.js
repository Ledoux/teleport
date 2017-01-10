#!/usr/bin/env node

const program = require('commander')

const Teleport = require('../lib').default

program
  .version('0.0.1')
  .option('configure', 'Configure')
  .option('-c, create', 'Create')
  .option('-d, deploy', 'Deploy')
  .option('dump', 'Dump')
  .option('-e, exec', 'Exec')
  .option('-g, get', 'Get')
  .option('-k, kill', 'Kill')
  .option('-l, log', 'Log')
  .option('-m, map', 'Map')
  .option('init', 'Init')
  .option('-i, install', 'Install')
  .option('-r, replace', 'Replace')
  .option('-s, start', 'Start')
  .option('-u, uninstall', 'Uninstall')
  .option('-z, zsh', 'Zsh')
  .option('status', 'Status')

  .option('--cache [type]', 'Cache', 'true')
  .option('--collection [type]', 'Collection')
  .option('--data [type]', 'Data', 'localhost')
  .option('--file [type]', 'file')
  .option('--folder [type]', 'Folder')
  .option('--force [type]', 'Force', /^(true|false)$/i, 'false')
  .option('--kwarg [type]', 'Kwarg', '')
  .option('--image [type]', 'Image')
  .option('--lang [type]', 'Language', 'js')
  .option('--lib [type]', 'Lib', /^(local|global)$/i, 'local')
  .option('--method [type]', 'Method')
  .option('--permission [type]', 'Permission', '')
  .option('--pip [type]', 'Pip', /^(true|false)$/i, 'true')
  .option('--project [type]', 'Project')
  .option('--scope [type]', 'Scope')
  .option('--script [type]', 'Script')
  .option('--server [type]', 'Server')
  .option('--servers [type]', 'Servers')
  .option('--templates [type]', 'Templates')
  .option('--ttab [type]', 'Ttab', 'false')
  .option('--type [type]', 'Type', /^(localhost|unname|staging|prod)$/i, 'localhost')
  .option('--types [type]', 'Types')
  .option('--user [type]', 'User', /^(me|jenkins)$/i, 'me')
  .option('--venv [type]', 'Venv', /^(true|false)$/i, 'true')
  .option('--web [type]', 'Web', /^(true|false)$/i, 'true')

  .option('')

  .parse(process.argv)

const localTeleport = new Teleport(program)

localTeleport.launch()

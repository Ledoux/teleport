#!/usr/bin/env node

const program = require('commander')

const Teleport = require('../lib').default

program
  .version('0.0.1')
  .option('-c, --create', 'Create')
  .option('--configure', 'Configure')
  .option('-d, --deploy', 'Deploy')
  .option('-e, --exec', 'Exec')
  .option('-k, --kill', 'Kill')
  .option('-l, --log', 'Log')
  .option('-i, --install', 'Install')
  .option('-r, --run', 'Run')

  .option('--data [type]', 'Data', 'localhost')
  .option('--lang [type]', 'Language', 'js')
  .option('--method [type]', 'Method')
  .option('--name [type]', 'Name', 'demo')
  .option('--permission [type]', 'Permission', '')
  .option('--server [type]', 'Server', /^(webrouter|websocketer)$/i)
  .option('--templates [type]', 'Templates', 'flask-webrouter,flask-websocketer')
  .option('--type [type]', 'Type', /^(localhost|unname|staging|prod)$/i, 'localhost')
  .option('--user [type]', 'User', /^(me|jenkins)$/i, 'me')
  .option('--venv [type]', 'Venv', /^(true|false)$/i, 'true')
  .option('--web [type]', 'Web', /^(true|false)$/i, 'true')

  .option('')

  .parse(process.argv)

const localTeleport = new Teleport(program)

localTeleport.start()

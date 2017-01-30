#!/usr/bin/env node
const program = require('commander')

const Teleport = require('../lib').default
const localTeleport = new Teleport()
localTeleport.launch()

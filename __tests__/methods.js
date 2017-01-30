const childProcess = require('child_process')
const path = require('path')

const Teleport = require('../lib').default

const TEST_APP_NAME = 'my-test-app'
const TEST_APP_DIR = path.join(process.cwd(), TEST_APP_NAME)

/*
// equivalent as 'tpt -c --name my-test-app --templates teleport-express-webrouter,teleport-flask-websocket'
test('create task', () => {
  childProcess.execSync('rm -rf my-test-app')
  const testTeleport = new Teleport({
    create: true,
    name: 'my-test-app',
    templates: 'teleport-express-webrouter,teleport-flask-websocket'
  }).launch()
})
*/

// equivalent as 'tpt -e --method getConfig'
test('execute utility method', () => {
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    exec: true,
    method: 'getConfig'
  }).launch()
})

/*
// equivalent as 'tpt -g --kwarg project.config'
test('get utility method', () => {
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    get: true,
    kwarg: 'project.config'
  }).launch()
})

// equvalent as 'tpt map --method install --collections project.config.backend.serversByName'
test('map utility method for installing', () => {
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.backend.serversByName'
    map: true
  }).launch()
})

// equvalent as 'tpt map --method get --kwarg run --collections project.config.typesByName,project.config.backend.serversByName'
test('map utility method for getting the run infos', () => {
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.typesByName,project.config.backend.serversByName'
    map: true,
    method: 'get',
    kwarg: 'run'
  }).launch()
})
*/

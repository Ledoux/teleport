const childProcess = require('child_process')
const _ = require('lodash')
const path = require('path')

const Teleport = require('../lib').default

const TEST_APP_NAME = 'my-test-app'
const TEST_TEMPLATES = 'teleport-express-webrouter,teleport-flask-websocket,teleport-heroku'
const TEST_APP_DIR = path.join(process.cwd(), TEST_APP_NAME)

// equivalent as 'tpt -c --name ${TEST_APP_NAME} --templates ${TEST_TEMPLATES}'
test('create task', () => {
  childProcess.execSync(`rm -rf ${TEST_APP_NAME}`)
  const testTeleport = new Teleport({
    create: true,
    name: TEST_APP_NAME,
    templates: TEST_TEMPLATES
  })
  testTeleport.launch()
})

test('execute utility method with getProjectsByName', () => {
  // equivalent as 'tpt -e --method getProjectsByName'
  let testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    exec: true,
    method: 'getProjectsByName'
  })
  let expectedValue = testTeleport.launch()
  // we expect that the test project is stored in the projects.json
  expect(typeof expectedValue[TEST_APP_NAME]).toBe('object')
})

test('get utility method', () => {
  // equivalent as 'tpt -g --kwarg project.config'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    get: true,
    kwarg: 'project.config'
  })
  const expectedValue = testTeleport.launch()
  // we expect the config to have the templateNames array with the good templates
  expect(expectedValue.templateNames).toEqual(TEST_TEMPLATES.split(','))
})

test('map utility method for installing', () => {
  // equvalent as 'tpt map --method install --collections project.config.backend.serversByName'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.backend.serversByName',
    map: true,
    method: 'install'
  }).launch()
})

test('map utility method for getting the run infos', () => {
  // equvalent as 'tpt map --method get --kwarg run --collections project.config.typesByName,project.config.backend.serversByName'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.typesByName,project.config.backend.serversByName',
    map: true,
    method: 'get',
    kwarg: 'run'
  })
  const expectedValue = testTeleport.launch()
  // we expect to have all the tags for each type and each server
  expect(_.flatten(expectedValue).map(run => run.tag)).toEqual([
    `localhost-${TEST_APP_NAME}-wbr`,
    `localhost-${TEST_APP_NAME}-wbs`,
    `${TEST_APP_NAME}-wbr`,
    `${TEST_APP_NAME}-wbs`,
    `stg-${TEST_APP_NAME}-wbr`,
    `stg-${TEST_APP_NAME}-wbs`
  ])
})

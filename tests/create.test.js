const childProcess = require('child_process')
const _ = require('lodash')

const Teleport = require('../lib').default
const {
  TEST_PREFIX_APP_NAME,
  TEST_APP_NAME,
  TEST_TEMPLATES,
  TEST_APP_DIR
} = require('./test.config.js')

// equivalent as 'tpt -c --name ${TEST_APP_NAME} --templates ${TEST_TEMPLATES}'
test('create task', () => {
  childProcess.execSync(`rm -rf ${TEST_PREFIX_APP_NAME}-*`)
  const testTeleport = new Teleport({
    create: true,
    name: TEST_APP_NAME,
    templates: TEST_TEMPLATES
  })
  testTeleport.launch()
})

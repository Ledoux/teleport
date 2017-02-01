const childProcess = require('child_process')

const Teleport = require('../lib').default
const {
  TEST_APP_NAME,
  TEST_APP_DIR
} = require('./test.config.js')

// Here we stop the tests for the jenkins part
// But for a user, it is still needed to test a start and a deploy
// command
if (process.env.JEST_TESTER !== 'jenkins') {
  // equivalent as 'tpt -d'
  test('deploy task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      deploy: true
    })
    testTeleport.launch()
    console.log(childProcess
      .execSync([
        `heroku apps:destroy staging-${TEST_APP_NAME} --confirm staging-${TEST_APP_NAME}`,
        `heroku apps:destroy staging-${TEST_APP_NAME}-wbs --confirm staging-${TEST_APP_NAME}-wbs`,
      ].join(' && ')).toString('utf-8')
    )
  })
}

// we need at least one test to make that jest passing
test('deploy default', () => {
  expect(true).toBe(true)
})

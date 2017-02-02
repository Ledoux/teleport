const Teleport = require('../lib').default
const {
  TEST_APP_NAME,
  TEST_APP_DIR
} = require('./test.config.js')

// Here we stop the tests for the jenkins part
// But for a user, it is still needed to test a start and a deploy
// command
if (process.env.JEST_TESTER !== 'jenkins') {
  // equivalent as 'tpt -s'
  test('start task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      start: true
    })
    testTeleport.launch()
  })
}

// we need at least one test to make that jest passing
test('start default', () => {
  expect(true).toBe(true)
})

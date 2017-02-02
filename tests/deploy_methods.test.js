const fetch = require('node-fetch')
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
  test('deploy staging task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      deploy: true
    })
    testTeleport.launch()
    // the servers are now deployed so we need now to ping them
    // to check their health
    fetch(`https://staging-${TEST_APP_NAME}.herokuapp.com/ping`)
      .then(function (res) {
        return res.text()
      }).then(function(body) {
        expect(body).toBe('PING')
        fetch(`https://staging-${TEST_APP_NAME}-wbs.herokuapp.com/ping`)
          .then(function (res) {
            return res.text()
          }).then(function(body) {
            expect(body).toBe('PING')
            // once we have checked the pings
            // we can delete these apps
            console.log(childProcess
              .execSync([
                `heroku apps:destroy staging-${TEST_APP_NAME} --confirm staging-${TEST_APP_NAME}`,
                `heroku apps:destroy staging-${TEST_APP_NAME}-wbs --confirm staging-${TEST_APP_NAME}-wbs`,
              ].join(' && ')).toString('utf-8')
            )
          })
      })
  })
  // equivalent as 'tpt -d --type production'
  /*
  test('deploy production task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      deploy: true,
      type: 'production'
    })
    testTeleport.launch()
    // the servers are now deployed so we need now to ping them
    // to check their health
    fetch(`https://${TEST_APP_NAME}.herokuapp.com/ping`)
      .then(function (res) {
        return res.text()
      }).then(function(body) {
        expect(body).toBe('PING')
        fetch(`https://${TEST_APP_NAME}-wbs.herokuapp.com/ping`)
          .then(function (res) {
            return res.text()
          }).then(function(body) {
            expect(body).toBe('PING')
            // once we have checked the pings
            // we can delete these apps
            console.log(childProcess
              .execSync([
                `heroku apps:destroy ${TEST_APP_NAME} --confirm ${TEST_APP_NAME}`,
                `heroku apps:destroy ${TEST_APP_NAME}-wbs --confirm ${TEST_APP_NAME}-wbs`,
              ].join(' && ')).toString('utf-8')
            )
          })
      })
    */
}

// we need at least one test to make that jest passing
test('deploy default', () => {
  expect(true).toBe(true)
})

require('babel-polyfill')
const fs = require('fs')
const path = require('path')

const { getRandomId } = require('../lib/utils/functions')

const TEST_PREFIX_APP_NAME = 't'
// maybe the test app suffix is already defined in the env
// but if not we can quickly check if there is not
// a folder app here in which we can do the test
let TEST_RANDOM = process.env.TEST_RANDOM
if (typeof TEST_RANDOM  === 'undefined') {
  const re = new RegExp(TEST_PREFIX_APP_NAME + '-')
  const testDir = fs.readdirSync(process.cwd())
      .find(dir => re.test(dir))
  if (testDir) {
    TEST_RANDOM = testDir.split(re)[1]
  }
}
const TEST_APP_NAME = `${TEST_PREFIX_APP_NAME}-${TEST_RANDOM}`
const TEST_TEMPLATES = 'teleport-express-webrouter,teleport-flask-websocket,teleport-heroku'
const TEST_APP_DIR = path.join(process.cwd(), TEST_APP_NAME)

module.exports = {
  TEST_PREFIX_APP_NAME,
  TEST_APP_NAME,
  TEST_TEMPLATES,
  TEST_APP_DIR
}

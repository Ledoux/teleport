const path = require('path')

const { getRandomId } = require('../lib/utils/functions')

const TEST_PREFIX_APP_NAME = 'my-test-app'
const TEST_APP_NAME = `${TEST_PREFIX_APP_NAME}-${getRandomId()}`
const TEST_TEMPLATES = 'teleport-express-webrouter,teleport-flask-websocket,teleport-heroku'
const TEST_APP_DIR = path.join(process.cwd(), TEST_APP_NAME)

module.exports = {
  TEST_PREFIX_APP_NAME,
  TEST_APP_NAME,
  TEST_TEMPLATES,
  TEST_APP_DIR
}

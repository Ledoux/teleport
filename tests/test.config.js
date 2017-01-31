const path = require('path')

const TEST_APP_NAME = 'my-test-app'
const TEST_TEMPLATES = 'teleport-express-webrouter,teleport-flask-websocket,teleport-heroku'
const TEST_APP_DIR = path.join(process.cwd(), TEST_APP_NAME)

module.exports = {
  TEST_APP_NAME,
  TEST_TEMPLATES,
  TEST_APP_DIR
}

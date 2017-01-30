const childProcess = require('child_process')
const Teleport = require('../lib').default

const CREATION_COMMAND = 'tpt -c --name my-app --templates teleport-express-webrouter,teleport-flask-websocket'

/*
'tpt -e --script ping --servers express-webrouter,flask-websocket'
'tpt -e --script ping --servers all'
'tpt -e --method getConfig'
'tpt -g --kwarg project.config'
'tpt map --method install --collections project.config.backend.serversByName'
'tpt map --method get --kwarg run --collections project.config.typesByName,project.config.backend.serversByName'
*/

/*
test('execute utility method', () => {
  const testTeleport = new Teleport({})
  console.log(childProcess.execSync(CREATION_COMMAND).toString('utf-8'))
})
*/

test('execute utility method', () => {
  childProcess.execSync('rm -rf my-test-app')
  const testTeleport = new Teleport({
    create: true,
    name: 'my-test-app',
    templates: 'teleport-express-webrouter,teleport-flask-websocket'
  }).launch()
})

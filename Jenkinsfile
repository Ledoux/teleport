@NonCPS
def mapToList(depmap) {
    def dlist = []
    for (def entry2 in depmap) {
        dlist.add(new java.util.AbstractMap.SimpleImmutableEntry(entry2.key, entry2.value))
    }
    dlist
}

def BACKEND_ONLY_TEST = "tests/backend_only_test"
def BACKEND_AND_FRONTEND_TEST = "tests/backend_and_frontend_test"

def cmds = [
'flask-webrouter':BACKEND_ONLY_TEST + ' fwbr teleport-flask-webrouter teleport-heroku',
'flask-websocket':BACKEND_ONLY_TEST + ' fwbs teleport-flask-websocket teleport-heroku',
'express-webrouter':BACKEND_ONLY_TEST + ' ewbr teleport-express-webrouter teleport-heroku',
'flask-webrouter-webpack-react':BACKEND_AND_FRONTEND_TEST + ' fwbr teleport-flask-webrouter teleport-webpack-react teleport-heroku',
'express-webrouter-webpack-react':BACKEND_AND_FRONTEND_TEST + ' ewbr teleport-express-webrouter teleport-webpack-react teleport-heroku',
'flask-webrouter-webpack-angular':BACKEND_AND_FRONTEND_TEST + ' fwbr teleport-flask-webrouter teleport-webpack-angular teleport-heroku',
'express-webrouter-webpack-angular':BACKEND_AND_FRONTEND_TEST + ' ewbr teleport-express-webrouter teleport-webpack-angular teleport-heroku'
]
def builders = [:]
node {
    for ( def c in mapToList(cmds) ) {
        def label = "${c.key}"
        def cmd = "${c.value}"

        builders[label] = {
          node('jenkins-teleport') {
              stage('Checkout') {
                  checkout scm
              }

              stage('Install') {
                  sh "npm install && npm link"
              }

              stage("${label}" + ' Test') {
                  sh "chmod -R +x tests/"
                  sh "${cmd}"
              }
          }
        }
    }

    parallel builders
}

#
# IMPORTS
#
import os
import sys
sys.path.append(os.environ.get('backendDir',"../"))
from websocketer import app,socketio

#
# ENVIRONMENT
#
DEV = 'dev'
HOST = os.environ.get("WEBSOCKETER_HOST","localhost")
TYPE = os.environ.get('TYPE',DEV)
PORT = int(os.environ.get("WEBSOCKETER_PORT",5001))

#
# MAIN
#
if __name__ == '__main__':
    socketio.run(
        app,
        host = HOST,
        port = PORT,
        use_reloader = TYPE==DEV
    )

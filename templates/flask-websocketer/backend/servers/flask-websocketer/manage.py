#
# IMPORTS
#
import os
import sys
sys.path.append(os.path.join('/'.join(__file__.split('/')[:-1], '../')))
from websocketer import app,socketio

#
# ENVIRONMENT
#
if ':' in os.environ['WEBSOCKETER_URL']:
    chunks = os.environ['WEBSOCKETER_URL'].split(':')
    HOST = ':'.join(chunks[:-1])
    PORT = int(chunks[-1])
else:
    HOST = "localhost"
    PORT = 5001

#
# MAIN
#
if __name__ == '__main__':
    socketio.run(
        app,
        host = HOST,
        port = PORT,
        use_reloader = app.config['TYPE'] == 'localhost'
    )

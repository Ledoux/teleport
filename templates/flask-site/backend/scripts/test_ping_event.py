#
# IMPORTS
#
import os
from socketIO_client import SocketIO
import sys

#
# ENVIRONMENT
#
if len(sys.argv) > 1:
    HOST = sys.argv[1]
    PORT = int(sys.argv[2])
else:
    HOST = "localhost"
    PORT = 5001

#
# TEST
#
if PORT != None:
    clientSocketIO = SocketIO(HOST,PORT)
else:
    clientSocketIO = SocketIO(HOST)

def test_pong(*args):
    print "PONG"
clientSocketIO.on('test_pong',test_pong)

clientSocketIO.emit('test_ping')
clientSocketIO.wait(seconds=2)

#
# IMPORTS
#
import os
import requests
import sys

#
# ENVIRONMENT
#
if len(sys.argv) > 1:
    HOST = "http://" + sys.argv[1]
    PORT = int(sys.argv[2])
else:
    HOST = "localhost"
    PORT = "5000"

#
# PING
#
print requests.get(HOST + ':' + PORT + '/ping').text

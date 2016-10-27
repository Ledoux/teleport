#
# IMPORTS
#
import datetime
import json
import os
import sys
sys.path.append(os.environ.get('backendDir',"../"))
from flask.ext.script import Manager, Server
from webrouter import app,password_hash

#
# ENVIRONMENT
#
DEV = "dev"
PORT = int(os.environ.get('webrouter_PORT',5000))

#
# MANAGER
#
manager = Manager(app)

# Turn on debugger by default and reloader
if os.environ.get('TYPE',DEV) == DEV:
    if app.config['TYPE'] == DEV:
        def json_serial(obj):
            if isinstance(obj,datetime.timedelta):
                return str(obj)
        print "Config is : "
        print json.dumps(
            app.config,
            default=json_serial,
            indent=2,
            sort_keys=True
        )
    manager.add_command(
        "runserver",
        Server(
            use_debugger = True,
            use_reloader = True,
            host = '0.0.0.0',
            port = PORT
        )
    )
else:
    manager.add_command(
        "runserver",
        Server(
            use_debugger = False,
            use_reloader = False,
            host = '0.0.0.0',
            port = PORT
        )
    )

#
# RUN
#
if __name__ == "__main__":
    manager.run()

#
# IMPORTS
#
from flask import Flask
from flask_socketio import SocketIO,send,emit
import os
import sys

#
# APP
#
app = Flask(__name__)

#
# CONFIG
#
default = {
    'DATA': "localhost",
    'TYPE': "localhost",
    'WEB': "on",
    'WEBROUTER_URL':  "http://localhost:5000",
    'WEBSOCKETER_URL': "http://localhost:5001"
}
config = {}
for couples in default.items():
	app.config[couples[0]] = os.environ.get(
		couples[0],
		couples[1]
	)
app.config['HOST_DIR'] = "./" if app.config['TYPE'] != 'localhost' else os.path.join(os.getcwd().split('backend')[0], 'backend/')

#
# ROUTES
#
@app.route('/')
def getHome():
	return "THIS IS THE WEBSOCKETER HOME..."

@app.route('/ping')
def getPing():
    return "ping"

#
# SOCKETIO
#
socketio = SocketIO(app)

#
# ON (BE CAREFUL "ping" event name is not allowed)
#
@socketio.on('test_ping')
def test_ping(*args):
    emit('test_pong',*args,broadcast=True)

#
# DATABASES
#
app.config['databases_by_name'] = {}

#
# REGISTER
#
def register_blueprints(app,backend_path):
    # let s import automatically the python files that are on the shared backend
    # lib folder
    lib_path = os.path.join(backend_path, 'lib')
    if os.path.isdir(lib_path):
        sys.path.append(lib_path)
        shared_lib_names = map(
            lambda fcouples:
            fcouples[0],
            filter(
                lambda couples:
                couples[-1]=='py' and couples[0] != "__init__",
                map(
                    lambda file_name:
                    file_name.split('.'),
                    filter(
                        lambda dir_name:
                        dir_name[0] != ".",
                        os.listdir(lib_path)
                    )
                )
            )
        )
    else:
        shared_lib_names = []
    # then we can also go to specific modules inside this webserver
    modules_path = os.path.join(backend_path, 'websocketer/modules')
    if os.path.isdir(modules_path):
        sys.path.append(modules_path)
        module_names = map(
            lambda fcouples:
            fcouples[0],
            filter(
                lambda couples:
                couples[-1]=='py' and couples[0] != "__init__",
                map(
                    lambda file_name:
                    file_name.split('.'),
                    filter(
                        lambda dir_name:
                        dir_name[0] != ".",
                        os.listdir(modules_path)
                    )
                )
            )
        )
    else:
        module_names = []
    # and also it specific libs
    lib_path = os.path.join(backend_path, 'websocketer/lib')
    if os.path.isdir(lib_path):
        sys.path.append(lib_path)
        lib_names = map(
            lambda fcouples:
            fcouples[0],
            filter(
                lambda couples:
                couples[-1]=='py' and couples[0] != "__init__",
                map(
                    lambda file_name:
                    file_name.split('.'),
                    filter(
                        lambda dir_name:
                        dir_name[0] != ".",
                        os.listdir(lib_path)
                    )
                )
            )
        )
        for lib_name in lib_names:
            __import__(lib_name)
    # once the modules and libs are imported we can now
    # also plug the blueprints flask to the app
    map(
        lambda module:
        app.register_blueprint(
            getattr(module, 'blueprint')
        ),
        filter(
            lambda module:
            hasattr(module,'blueprint'),
            map(
                lambda module_name:
                __import__(module_name),
                module_names
            )
        )
    )
register_blueprints(
    app,
    app.config['HOST_DIR']
)

#
# TABLES
#
app.config['tables_by_name'] = {}
for database_name, database in app.config['databases_by_name'].items():
    for table in database['tables']:
        table['database_name'] = database_name
        app.config['tables_by_name'][table['name']] = table

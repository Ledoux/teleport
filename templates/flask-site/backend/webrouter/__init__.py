#
# IMPORTS
#
import sys
from flask import Blueprint,Flask,flash,g,render_template
from flask.ext.login import LoginManager,current_user
import hmac
import json
import logging
import os

#
# FLASK
#
app = Flask(
    __name__,
    static_folder = '../build/static/',
    template_folder = '../build/templates/'
)
specific_blueprint = Blueprint(
    'specific',
    __name__,
    static_folder = '../build/static/',
    template_folder = '../build/specific_templates/'
)
app.register_blueprint(specific_blueprint)

#
# CONFIG
#
default = {
    'DATA': 'localhost',
    'DEPLOY': 'localhost',
    'SMTP_HOST': "smtp.corp.snips.net",
    'SITE_NAME': "unnamed",
    'TYPE': 'dev',
    'WEB': "on",
    'WEBROUTER_URL':  'http://localhost:5000',
    'WEBSOCKETER_URL': 'http://localhost:5001'
}
config = {}
for couples in default.items():
	app.config[couples[0]] = os.environ.get(
		couples[0],
		couples[1]
	)
app.config['HOST_DIR'] = "./" if app.config['DEPLOY'] != 'localhost' else os.path.join(os.getcwd().split('backend')[0], 'backend/')

#
# CONSTANTS
#
config_dir = os.path.join(app.config['HOST_DIR'], 'config')
constants_dir = os.path.join(config_dir, 'constants.json')
with open(constants_dir, 'r') as file:
    app.config.update(json.load(file))
specific_constants_dir = os.path.join(config_dir, 'specific_constants.json')
if os.path.isfile(specific_constants_dir):
    with open(specific_constants_dir, 'r') as file:
        app.config.update(json.load(file))

#
# DATABASES
#
app.config['databases_by_name'] = {}

#
# CLIENT SECRET
#
client_secret_name = app.config['DEPLOY'] + '_client_secret.json'
client_secret_path = os.path.join(config_dir, client_secret_name)
if os.path.isfile(client_secret_path):
    with open(client_secret_path,'r') as cl_se:
        app.config["GOOGLE_CLIENT_ID"] = json.load(cl_se)['web']['client_id']

#
# FLASK ENV
#
flask_env = {
    "SITE_NAME": app.config["SITE_NAME"],
    "WEB": app.config["WEB"],
    "WEBROUTER_URL": app.config["WEBROUTER_URL"],
    "WEBSOCKETER_URL": app.config["WEBSOCKETER_URL"]
}

#
# ROUTES
#
INDEX_HTML_NAME = '_index.html' if app.config['TYPE'] == 'dev' else '_index_prod.html'

@app.route('/')
def get_home():
	return render_template(
        INDEX_HTML_NAME,
        **flask_env
    )

@app.route('/ping')
def get_ping():
    return 'ping'

# serve index for all paths, so a client side router can take over
@app.route('/<path:path>')
def get_home_redirect(path):
	return get_home()

#
# LOGIN
#
# if the module private is not inside the module folder,
# then the login manager of flask is not called to be set.
# By a certain non explained almost magical reason, this fix the property of
# the flask to render static files.
if os.path.isfile(os.path.join(app.config['HOST_DIR'], 'webrouter/modules/private.py')):
    login_manager = LoginManager(app)
    login_manager.login_view = 'private.login_index'
    @app.before_request
    def add_user_before_request():
        g.user = current_user
def password_hash(password):
    return hmac.new(app.config.get('HMAC_KEY', ''), password).hexdigest()

#
# BLUEPRINTS
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
    modules_path = os.path.join(backend_path, 'webrouter/modules')
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
    lib_path = os.path.join(backend_path, 'webrouter/lib')
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
            getattr(
                module,
                'blueprint'
            )
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

#
# RUN
#
if __name__ == '__main__':
    app.run()

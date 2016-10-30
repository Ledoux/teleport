#
# IMPORTS
#
import sys
from flask import Blueprint,Flask,flash,g,render_template
import os
import hmac
import json

#
# FLASK
#
app = Flask(__name__)

#
# CONFIG
#
default = {
    'DATA': "localhost",
    'SMTP_HOST': "localhost",
    'SITE_NAME': "",
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
client_secret_name = app.config['TYPE'] + '_client_secret.json'
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
INDEX_HTML_NAME = '_index.html' if app.config['TYPE'] == 'localhost' else '_index_prod.html'

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
is_login = os.path.isfile(os.path.join(app.config['HOST_DIR'], 'webrouter/modules/private.py'))
if is_login:
    from flask.ext.login import LoginManager,current_user
    login_manager = LoginManager(app)
    login_manager.login_view = 'private.login_index'
    @app.before_request
    def add_user_before_request():
        g.user = current_user
#
# BLUEPRINTS
#


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

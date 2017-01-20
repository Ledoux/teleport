APP_DIR=$PWD
APP_CMD=tpt
cd /usr/local/bin && ln -sf $APP_DIR/bin/index.js $APP_CMD && chmod +x $APP_CMD && chmod +x $APP_DIR/bin/index.py && cd $APP_DIR

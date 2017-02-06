# Teleport
[![Build Status](https://jenkins2.snips.ai/buildStatus/icon?job=Snips Web/teleport/master)](https://jenkins2.snips.ai/job/Snips Web/teleport/master)
[![npm version](https://badge.fury.io/js/teleport.js.svg)](https://badge.fury.io/js/teleport.js)

<table>
  <td>
    <img src="icon.png" alt="icon" title="made by @cecilesnips"/>
  </td>
  <td>
    A node framework to quickly bootstrap and deploy applications based on templates
  </td>
</table>

## Overview
![Teleport overview icon](docs/teleport_overview.png "Teleport overview")

### Templates
- [Existing templates](docs/templates_list.md)

## Getting started
### Installation

1. Production
  You want to use teleport as a pure user:
  - make sure you have Node version >= 6 and Python 2.7 + pip >= v8
  - install globally the npm package with yarn (https://yarnpkg.com/)
  ```
  yarn global add teleport.js
  ```
  The binary `tpt` CLI is available now!

2. Development
  You want to use and develop the app:
  - clone the repository
  ```
  git clone git@github.com:snipsco/teleport.git
  ```
  - go to your cloned
  teleport repo and symlink your tpt command to the bin/index of this folder:
  ```
  yarn run link
  ```
  - you can then develop the src files automatically compiled into the lib folder
  thanks to the watch command:
  ```
  yarn run watch
  ```

NOTE: if you want to make sure that you have all the good configs for using the app, you can do:
```
tpt check
```

## Setup backends
Teleport support for now 2 types of backend: Kubernetes and Heroku. We strongly recommend to start with Heroku in order to test the framework as Kubernetes needs a more complex infrastructure and specifics options to work.

### Heroku
To get started with heroku, just create an account (if not already done) on the platform: https://www.heroku.com/. Then install the command line tool https://devcenter.heroku.com/articles/heroku-cli.  

Setup your credentials
```
heroku login
```

That's it! You are all set! :smiley:

### Kubernetes
Not well supported yet... We are fixing this :construction:

[Additional setup](app_database.md) to the Kubernetes cluster.

## Start a new project
As an example let's create a web app on Heroku platform with the following components:
- A Python Flask server
- A Webpack React frontend on top of the server  

### Creation
We **highly recommend to create a teleport application within a python virtual environment** as it will install some python dependencies. Before creating your application just type
```bash
virtualenv venv
source venv/bin/activate # On Linux . venv/bin/activate
```

We then create the app by typing
```
tpt -c --templates teleport-flask-webrouter,teleport-webpack-react,teleport-heroku
```
:warning: Please ensure that the options listed after the --templates flag are separated just by a single comma, as above - without any extra spaces - otherwise it will not work properly.

By default Teleport generates a random app name for you (like `app-685af6ba`). To specify your own app name, use `--name my-app-name`.

You can have more informations about those templates by checking their repos:
- [Flask webrouter](https://github.com/snipsco/teleport-flask-webrouter)
- [Webpack React](https://github.com/snipsco/teleport-webpack-react)
- [Heroku](platforms/heroku/)

:exclamation: Help I have some issues with uwsgi on MacOS when creating an app! No panic, just follow [this link](docs/uwsgi_issues.md).

### Run locally
If you want to test the app locally you can type
```
tpt -s
```
Note that
```
tpt -e --method getUrls
```

### Deploy the app
Let's now deploy it directly on Heroku as we choose this platform template.
```
tpt -d
```
The default deployment setting is a staging type. If you check the urls of your deployed servers:
```
tpt -e --method getUrls --type staging
```
But you can of course deploy in production by specifying:
```
tpt -d --type production
```
In a summary, all your urls are available here
```
tpt -g --kwarg run.url --servers all --types all
```
Or
```
tpt -e --method getAllUrls
```

:smiley: Enjoy !

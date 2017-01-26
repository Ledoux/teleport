# Teleport methods

Teleport is an application that makes easier the different steps in a bootstraping/deployment process.

We defined an ontology of methods splitting this workflow into small pieces of tasks and sub-tasks. You can look at the graph below that explains how is structured the global spec of Teleport.

```
+-- create
|   - create project folder
|   - reference the project in .projects.json
|   +-- init
|   |   - download templates
|   |   +-- configure
|   |   |   - merge the config files from templates
|   |   +-- dump
|   |   |   - merge the file systems from templates
|   |   |   (but override files)
|   +-- install:
|   |   - install python and or node dependencies in each server
|   |   - install node dependencies for frontend (if it exists)
+-- start
|   - start locally the manager for each server
|   - start frontend dev server (if it exists)
+-- deploy
|   +-- build
|   |   - create the Heroku app / build the docker image
|   +-- push
|   |   - push the file system into a new heroku commit / push the docker image
|   +-- run
|   |   - start a web heroku dyno / start a docker container
```

Note that each of them is callable by a command option. For instance, you can type `tpt install` or shorter `tpt -i`. you can look at the [commander config of the app](https://github.com/snipsco/teleport/blob/master/bin/index.js]) to know all the apis.

Also you need to know what Teleport instancify at any call of the binary:
  - set the app, project, backend, servers, frontend environments.  
  - launch the command given the program state.

# Teleport methods

Teleport is an application that makes bootstraping and deployment easier.

We defined a set of methods splitting this workflow into small pieces of tasks (create, start, deploy) and sub-tasks (init, configure, dump, install, replace, build, push, run). You can look at the graph below that explains how is structured the global spec of Teleport.

```
+-- create
|   - create project folder
|   - reference the project in .projects.json
|   +-- init
|   |   - download the templates
|   |   +-- configure
|   |   |   - merge the config files from templates
|   |   +-- dump
|   |   |   - merge the file systems from templates
|   +-- install:
|   |   - install python and or node dependencies in each server
|   |   - install node dependencies for frontend (if it exists)
|   |   +-- replace
|   |   |   - grab all the placeholder files in the templates and write them into the project with replaced config values
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

Note that these methods are callable by a command option. For instance, you can type `tpt install` or shorter `tpt -i`. you can look at the commander config [there](https://github.com/snipsco/teleport/blob/master/bin/index.js]) to know the full api.

Also you need to know what Teleport instances at any call of the binary:
  - it sets the app, project, backend, and the frontend environments. This essentially done by reading each `.teleport.json` config file that the app finds
  in each node of the file system, and then bind to the Teleport instance `this` a corresponding available object. That's how notably you have set in the app the variable `this.project.config` which is the serialisation of the `.teleport.json` of the project at its root dir. But you will have also available the variable `this.backend` which is actually the serialisation of the `this.project.config.backend` plus some other attributes given the context of the app and the project.
  - it calls `launch` method that handles how to proceed the command given the program state.
    - Based the program arguments it can set contextual attributes. Notably
    `this.server` and `this.type` if the cli has mentioned a specific server or a specific type for the command.
    - it looks if it has actually to run one single method or actually map the application of a method to a certain list of entities. The most common pattern that is called in Teleport is when we want actually to deploy things automatically for all the servers and all the types. You can look at the method
    this.mapInTypesAndServers that makes shorter this kind of execution.

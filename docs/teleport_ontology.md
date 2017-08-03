# Teleport ontology
In one instance of Teleport (typically when you call the tpt CLI),
the application encapsulates config variables into different scopes.

Some of these scopes are directly the mirror of the file system architecture: project,
backend, frontend and bundler.

## project
This is the highest scope that the app defines. It parses directly
the state of the .teleport.json into the `this.project.config` object, so as the
package.json into `this.project.package` one.  

## backend
The backend is responsible for deploying your server(s).
At the launch time, Teleport sets also `this.backend` object, composed by the parsing
of this.project.config.backend plus some other context dependent variables.

A backend has two important child collections. First one is
`backend.serversByName` that contains the configuration of your
different servers (like express-webrouter, flask-websocket). The other one is
`backend.helpersByName` which contains the configs for you different third
parties dependencies helping to set your platforms of deployment
(like docker, kubernetes, heroku).

## server
If your CLI has defined a specific server to handle with
(via for instance the option --server `express-webrouter`) the app then also binds
`this.server` with the correspdonding `this.project.config.backend.serversByName.express-webrouter`
and also sets other dynamic variables.

## type
A type is the object that defines a certain environment for deployment.
It is typically sets of parameters specific to a development, or a staging or a
production use (like the host, port values). You can ask Teleport to do something
for a particular type with the --type option.

## run
If the CLI has defined a particular server and a specific type, then it also sets
`this.run`. It contains the particular configuration of a server given this type
(like the url, subDomain values) for running an instance.

## frontend
`this.frontend` is defined if the project needs to bundle some scripts and style
from a frontend folder. Note that the configuration of the bundler is in the
bundler folder, and you need to see the file src/methods/dump.js to understand how
Teleport binds after the bundle to the good rendering server.

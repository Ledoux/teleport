# Getting started with frontend templates
Here are some additional informations about frontend templates architecture. As an example we take the webpack react template.

## Files tree
```
.
+-- .teleport.json
+-- package.json
+-- README.md
+-- backend/servers/frontend-server/app
|   +-- templates
|   +-- static
+-- bin
|   +-- bundle.sh
|   +-- development_bundle.sh
+-- bundler
|   +-- <REPLACE>config.js
|   +-- <REPLACE>webpackDevServer.js
|   +-- dev.config.js
|   +-- prod.config.js
+-- frontend
|   +-- styles
|   |   +-- style.css
|   +-- scripts
|   |   +-- index.js
|   |   +-- react
|   |   |   +-- components
|   |   |   |   +-- ReactBackground.js
|   |   |   +-- containers
|   |   |   |   +-- Root.js
```

### Root level
- *package.json*: A teleport template is a js package, this file describe the package.
- *.teleport.json*: The teleport configuration file.

Nb: The folders `backend/servers/frontend-server/app` should always be like this. If not, Teleport should not be able to bind the frontend to a backend template.

### Into backend/servers/frontend-server/app
In this folder we should put 2 templates `_prod_bundle.html` and `_dev_bundle.html` that load the js bundle into the frontend page. Remember that backend templates look for those files in order to put them into the head part of the `index.html`. Bundle are generated through webpack (see bundler folder).

### Into bin
In this folder we should have 2 scripts to run webpack commands. They are highly linked to the bundler folder where configurations for webpack can be found.

### Into bundler
In this folder we should have all webpack related files.
TODO

### Into frontend
In this folder we should have the frontend application. The architecture should respect the one presented before with 2 sub folders `scripts` and `styles`. In the `scripts` folder you have another folder with the name of the framework used (react in our case) and a `index.js` file used for loading the framework.

Nb: The app should be loaded into a single div container with the ID `app_div`. Remember that this is the ID we gave into our backend templates for the `index.html`.

If the frontend failed to load (bundle not working or app not loaded properly...) then we fallback on the backend api and server the index template of the backend.

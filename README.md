# teleport

<table>
  <td>
    <img src="icon.png" alt="icon" title="made by @cecilesnips"/>
  </td>
  <td>
    A node framework to install and run quickly applications based on Node/Flask servers via kubectrl
  </td>
</table>

## Get started

1. make sure you have global dependencies

  - node v > 6
    ```
    git clone git://github.com/ry/node.git
    cd node
    ./configure
    make
    sudo make install
    ```

  - pip > 9
    ```
    curl https://bootstrap.pypa.io/get-pip.py -o "get-pip.py"
    python get-pip.py
    ```

  - yarn
    ```
    npm install -g yarn
    ```

  - virtualenv > 15.0.3 (use --upgrade if you already have an older version)
    ```
    sudo pip install virtualenv
    ```

  - kubectl
    ```
    if [ '$(KERNEL)' = 'Darwin' ]; then \
  		curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/darwin/amd64/kubectl; \
  	else \
  		curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/linux/amd64/kubectl; \
  	fi
  	chmod +x kubectl
  	mv kubectl /usr/local/bin/
    ```

2. then install it globally (WARNING: this is not yet a public package, so you need
  to register to our private npm-registry and be connected to our VPN)
  ```
  npm set registry https://npm-registry.corp.snips.net
  npm install -g teleport.js
  ```

3. Let's create a new project, based on our favorite templates here at Snips:
  ```
  tpt -c --project myApp --templates teleport-flask-webrouter, teleport-snips
  ```
  (to know more about these templates, see https://github.com/snipsco/teleport-flask-webrouter and https://github.com/snipsco/teleport-snips)

5. install the project
  ```
  cd myApp & tpt -i
  ```

5. Inside of the project you can run it localhost, first
  ```
  tpt -s
  ```

6. And you can deploy
  ```
  tpt -d
  ```

7. It should display
  ```
  Your service is available here : <your_dns_app>
  ```
  But make sure your your_dns_app is registered (ask @franblas if it is not the case)

Enjoy !

## Default Scope

We recommend you to play with the templates given in the default scope, like the default demo one (https://github.com/Ledoux/catapult/blob/master/examples/demo/README.md)

  - create step looks like :
  ![alt text](gifs/teleport-create.gif "Demo Example Create")

  - install step looks like (but note that we chose the pip false option to not
    install the python libs in order to make shorter the gif video)
  ![alt text](gifs/teleport-install.gif "Demo Start")

  - start step looks like :
  ![alt text](gifs/teleport-start.gif "Demo Start")

  - deploy step looks like :
  ![alt text](gifs/teleport-deploy.gif "Demo Deploy")

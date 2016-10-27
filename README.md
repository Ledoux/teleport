# teleport

<table>
  <td>
    <img src="icon.png" alt="icon" title="made by @cecilesnips"/>
  </td>
  <td>
    A node framework to install and deploy quickly applications based on Node/Flask servers via kubectrl
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

  - yarn
    ```
    npm install -g yarn
    ```

  - virtualenv
    ```
    sudo pip install virtualenv
    ```

  - rethinkdb
    ```
    brew install rethinkdb
    ```

  - kubectrl
    ```
    if [ '$(KERNEL)' = 'Darwin' ]; then \
  		curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/darwin/amd64/kubectl; \
  	else \
  		curl -O http://storage.googleapis.com/kubernetes-release/release/v1.2.3/bin/linux/amd64/kubectl; \
  	fi
  	chmod +x kubectl
  	mv kubectl /usr/local/bin/
    ```

2. then install it globally
  ```
  npm set registry https://npm-registry.corp.snips.net
  npm install -g teleport
  ```

  or via git and install locally

  ```
  git clone git@github.com:Ledoux/teleport.git && cd teleport && yarn
  ```

3. create a new project as a test
  ```
  tpt -c --template flask-site --name myApp
  ```

4. emulate it localhost first
  ```
  cd myApp & tpt -e
  ```

5. deploy it
  ```
  tpt -d
  ```

6. It should display
  ```
  Your service is available here : <your_dns_app>
  ```
  But make sure your your_dns_app is registered (ask @franblas if it is not the case)

Enjoy !

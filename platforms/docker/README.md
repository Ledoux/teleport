# teleport-docker
Deployment configuration for [teleport](https://github.com/snipsco/teleport) in the case of a docker/kubernetes infrastructure.

## Ontology
### backend
- domain: main subdomain of the app dns
- helpersByName
  - docker
    - host: docker server hostname. By default localhost.
    - imagesByName: base docker image configuration. By default the teleport one.
    - tcp: docker socket. If set to true, port and host should be defined. By default unix socket.
    - port: docker socket port. By default None.
    - registry
      - url: docker registry url. By default public one.
    - version: docker server version. By default 1.10.2.
  - kubernetes
    - host: kubernetes master hostname. By default None. [REQUIRED]
    - port: kubernetes master port. By default None. [REQUIRED]
    - nodeDomain: kubernetes node subdomain. By default None.
    - url: kubernetes dashboard url. By default None.

### typesByName
- <key>
  - subDomain: prefix added to nodeDomain. Default to None. [REQUIRED]
  - hasDns: does the app have a DNS? [REQUIRED]
  - abbreviation: special tag for containers. [REQUIRED]

## How to use it
Simply add it to the list of templates. For instance:
```
tpt -c --templates teleport-flask-webrouter,teleport-docker
```

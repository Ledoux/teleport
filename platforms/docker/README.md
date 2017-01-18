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
      - host: docker registry hostname. If point to a private registry, you should provide a port. By default public one.
      - port: docker registry port. By default None.
    - version: docker server version. By default 1.10.2.
  - kubernetes
    - host: kubernetes master hostname. By default None. [REQUIRED]
    - port: kubernetes master port. By default None. [REQUIRED]
    - nodeDomain: kubernetes node subdomain. By default None.
    - url: kubernetes dashboard url. By default None.

### typesByName
- <key>
  - subDomain: prefix added to nodeDomain. Default to None. [REQUIRED]
  - hasDns: TODO [REQUIRED]
  - abbreviation: special tag for containers. [REQUIRED]

## How to use it
Simply add it to the list of templates. For instance:
```
tpt -c --project my-app --templates teleport-flask-webrouter,teleport-docker
```

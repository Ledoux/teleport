# Applications database
This is an additional setup if you want to use Teleport for deploying application on a Kubernetes cluster.

## Requirements
- A working Kubernetes cluster `v1.2.3 >=`
- Docker client `v1.10.2 >=`

No private docker registry is required.

## Architecture
A Teleport application is defined by 2 Kubernetes description files:  
- `controller.yaml`: the replication controller configuration.
- `service.yaml`: the network configuration.

In order to keep those configurations at the same place and accelerate the search of applications we setup a database on the system.

The database is documented-oriented and only have one collection. We are using [rethinkdb](https://github.com/rethinkdb/rethinkdb) as database technology. Each document of the collection has the following format
```json
"lastupdate": "2017-01-01T00:00:00.000000+00:00",
"name": "my-app",
"replicationcontroller": {
  "...": "..."
},
"server": "",
"service": {
  "...": "..."
}
```

## Setup
- Install rethinkdb: https://rethinkdb.com/docs/install/
- Start an instance: `rethinkdb`
- Go to http://localhost:8080 and create a new database `infraservices` and the collection `services` for this database.

You are all set ! :)

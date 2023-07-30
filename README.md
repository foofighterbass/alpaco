# All you need to install your own "Nice Fellow of Day" bot
---

## Prerequisites
You have two ways to install "Nice Fellow of Day" application: using docker or installing node.js and postgresql manually. If you want to use docker, you need to install it on your machine. 

## Installation using docker

### Build container with bot
In this repository we already have Dockerfile to build container with our application. Use command bellow to build it:
`docker build -t  alpaco-app .`

### Create docker network
We won't use docker-compose or k8s for orchestration our containers. But we still need to connect them with each other. So, lets create docker network:
`docker network create mynetwork`

### Run all necessary containers
We almost there. Lets run container with database in our docker network:
`docker run --network=mynetwork --name alpaca-db-conteinireized -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=alpaca -d -v $HOME/db_data:/var/lib/postgresql/data postgres:13.3`

Finally lets run container with our application also in docker network
`docker run --network=mynetwork --name alpaco-conteinireized -d alpaco-app`


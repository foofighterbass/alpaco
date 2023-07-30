# All you need to install your own "Nice Fellow of Day" bot
---

## Prerequisites
You have two ways to install **"Nice Fellow of Day"** application: using docker or installing node.js and postgresql manually. If you want to use docker, you need to install it on your machine.

In both cases you need to fulfill `vault.js` file with your own credentials for database and telegram bot token

## Installation using docker

### Build container with bot
In this repository we already have Dockerfile to build container with our application. Use command bellow to build it:
```sh
docker build -t  alpaco-app .
```


### Create docker network
We won't use docker-compose or k8s for orchestration our containers. But we still need to connect them with each other. So, lets create docker network:
```sh
docker network create mynetwork
```


### Run all necessary containers
We almost there. Lets run container with database in our docker network:
```sh
docker run --network=mynetwork --name {db_container_name} -e POSTGRES_USER={db_user} -e POSTGRES_PASSWORD={db_password} -e POSTGRES_DB={db_name} -d -v $HOME/{path_for_db_mount}:/var/lib/postgresql/data postgres:13.3
```
Variables in braces need to be edited with your own values:
| Variable | Explaination |
| ------ | ------ |
| db_container_name | Container name, that will created for database |
| db_user | Username for database |
| db_password | Password for database |
| db_name | Database name |
| path_for_db_mount | Path, that will used for database outside from container |


Finally lets run container with our application also in docker network
```sh
docker run --network=mynetwork --name alpaco-conteinireized -d alpaco-app
```

That's all! Now you can enjoy your own app.

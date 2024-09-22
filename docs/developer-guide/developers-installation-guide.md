# Developers Installation Guide

## Prerequisites

To ensure Hexabot runs smoothly, you'll need the following:

* **Docker:** We recommend using Docker to start the app since multiple services are required (MongoDB, Redis, Prometheus, etc.). All the necessary Docker Compose files are located in the docker folder.
* **Node.js:** For development purposes, ensure you have Node.js >= v18.17.0 installed. We recommend using nvm (Node Version Manager) to easily manage and update your Node.js versions.

### Installation

1. **Clone the Repository:**

```
$ git clone https://github.com/hexastack/hexabot.git
```

2. **Environment Setup:** \
   To configure the environment variables, use the Makefile at the root folder for initialization:

```
$ make init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

3. **Running the Application in development mode:** Once your environment is set up, you can start the app. Use either of the following commands:

```
$ make dev
```

**Note:** The first time you run the app, Docker will take some time to build all the required Docker images cache the layers.

### Usage

UI Admin Panel is accessible via [http://localhost:8080](http://localhost:8080), the default credentials are :

* **Username:** [admin@admin.admin](mailto:admin@admin.admin)
* **Password:** adminadmin

Live Chat Widget is accessible via [http://localhost:5173](http://localhost:5173)



### Useful Commands

* `make init` : Copies the .env.example file to .env in the ./docker directory if .env does not exist. This is usually used for initial setup.
* `make dev` : Builds the Docker images locally before starting the services in development mode. It first checks the .env file for completeness against .env.example.
* `make start` : Starts the app by pulling the Docker images from Docker Hub. This target also checks the .env file for required variables.
* `make stop` : Stops all running Docker services defined in the compose files.
* `make destroy` : Stops all services and removes all volumes associated with the Docker compose setup, ensuring a clean state.
* `make check-env` : Checks if the ./docker/.env file exists and contains all the necessary environment variables as defined in ./docker/.env.example. If the file does not exist, it is created from the example. It also lists missing variables if any.

Example on how to start the stack by adding the Nginx service :

```
make start NGINX=1
```

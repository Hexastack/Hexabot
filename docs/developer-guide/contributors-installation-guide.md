---
icon: handshake-angle
---

# Contributers Installation Guide

## Prerequisites

To ensure Hexabot runs smoothly, you'll need the following:

* **Docker:** We recommend using Docker to start the app since multiple services are required (MongoDB, Redis, Prometheus, etc.). All the necessary Docker Compose files are located in the docker folder.
* **Node.js:** For development purposes, ensure you have Node.js >= v18.17.0 installed. We recommend using nvm (Node Version Manager) to easily manage and update your Node.js versions.

### Installation

1. **Clone the Repository:**

```
$ git clone https://github.com/hexastack/hexabot.git
```

2. **Installation:**

Install Hexabot CLI and node dependencies:

```
$ npm i -g hexabot-cli
$ cd hexabot/
$ npm i
```

2. **Environment Setup:**&#x20;

To configure the environment variables, use the Makefile at the root folder for initialization:

```
$ hexabot init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

3. **Running the Application in development mode:** Once your environment is set up, you can start the app. Use the following command:

```
$ hexabot dev
```

**Note:**&#x20;

* The first time you run the app, Docker will take some time to build all the required Docker images and cache the layers.
* The "**--services**" allows you to add additional services comma separated. For each service, there needs to be a Docker compose file under the "**docker/**" directory. For instance, if you do "**--services nginx**" you will need to have a docker compose file for that service "**docker/docker-compose.nginx.yml**"

### Usage

UI Admin Panel is accessible via [http://localhost:8080](http://localhost:8080), the default credentials are :

* **Username:** [admin@admin.admin](mailto:admin@admin.admin)
* **Password:** adminadmin

Live Chat Widget is accessible via [http://localhost:5173](http://localhost:5173)

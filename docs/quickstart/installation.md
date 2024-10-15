---
icon: laptop-arrow-down
---

# Installation

## Prerequisites

To ensure Hexabot runs smoothly, you'll need the following:

* **Docker:** We recommend using Docker to start the app since multiple services are required (MongoDB, Nginx, etc.). All the necessary Docker Compose files are located in the docker folder.

{% hint style="info" %}
Check Docker official guide on how to install Docker on your system [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)&#x20;
{% endhint %}

* **Node.js:** For development purposes, ensure you have Node.js >= v18.17.0 installed. We recommend using nvm (Node Version Manager) to easily manage and update your Node.js versions.

{% hint style="info" %}
To **install** or **update** nvm, you should run the [install script](https://github.com/nvm-sh/nvm/blob/v0.40.1/install.sh). To do that, you may either download and run the script manually, or use the following cURL or Wget command:

_curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash_&#x20;

Check NVM official documentation for more details :[https://github.com/nvm-sh/nvm?tab=readme-ov-file#node-version-manager---](https://github.com/nvm-sh/nvm?tab=readme-ov-file#node-version-manager---)&#x20;
{% endhint %}

### # Installation

1. **Clone the Repository:**

```
$ git clone https://github.com/hexastack/hexabot.git
```

2. **Installation:**

Install node dependencies using:

```
$ npm install
```

2. **Environment Setup:**&#x20;

To configure the environment variables, use the Makefile at the root folder for initialization:

```
$ npx hexabot init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

3. **Running the Application:** Once your environment is set up, you can start the app. Use either of the following commands:

{% hint style="info" %}
**Note:** The first time you run the app, Docker will take some time to download all the required images
{% endhint %}

<details>

<summary>Do you want to install Hexabot on a Windows machine?</summary>

1. Install Docker Desktop for Windows Download and install Docker Desktop for Windows.
2. During installation, ensure that you select the option to use WSL 2 as the default backend for Docker.
3. After installation, start Docker Desktop and verify that WSL integration is enabled:
4. Open Docker Desktop and go to Settings. Under the General tab, ensure that "Use the WSL 2 based engine" is selected. Under Resources > WSL Integration, enable integration with your installed Linux distribution (e.g., Ubuntu). Restart your machine to finalize the Docker installation.
5. Clone the Hexabot Repository Open your WSL terminal (e.g., Ubuntu).

Learn more : [https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers)

</details>

```
$ npx hexabot start
```

Or for development mode:

```
$ npx hexabot dev
```

You can enable specific services like the NLU engine, nginx or smtp4dev (coma seperated) :

```
$ npx hexabot dev --enable=nlu
```

### Usage

UI Admin Panel is accessible via [http://localhost:8080](http://localhost:8080), the default credentials are&#x20;

{% code title="Username" %}
```
admin@admin.admin
```
{% endcode %}

{% code title="Password" %}
```
adminadmin
```
{% endcode %}

Live Chat Widget demo is accessible via [http://localhost:5173](http://localhost:5173)

### Useful Commands

* `npx hexabot init` : Copies the .env.example file to .env in the ./docker directory if .env does not exist. This is usually used for initial setup.
* `npx hexabot dev` : Builds the Docker images locally before starting the services in development mode. It first checks the .env file for completeness against .env.example.
* `npx hexabot start` : Starts the app by pulling the Docker images from Docker Hub. This target also checks the .env file for required variables.
* `npx hexabot stop` : Stops all running Docker services defined in the compose files.
* `npx hexabot destroy` : Stops all services and removes all volumes associated with the Docker compose setup, ensuring a clean state.

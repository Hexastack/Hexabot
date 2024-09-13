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

2. **Environment Setup:** \
   To configure the environment variables, use the Makefile at the root folder for initialization:

```
$ make init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

3. **Running the Application:** Once your environment is set up, you can start the app. Use either of the following commands:

{% hint style="info" %}
**Note:** The first time you run the app, Docker will take some time to download all the required images
{% endhint %}

<details>

<summary>If you are installing Hexabot on macOS, follow the steps below before you run the application</summary>

The `make` command is not installed by default on macOS, but there are a few ways to get it:

### Install Command Line Tools for Xcode

The easiest way to get `make` on macOS is to install the Command Line Tools for Xcode:

1. Open the Terminal app
2. Run the command: `xcode-select --install`
3. Follow the prompts to install the Command Line Tools

This will install `make` and other developer tools without needing to install the full Xcode IDE

</details>

```
$ make start
```

Or for development mode:

```
$ make dev
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

* `make init` : Copies the .env.example file to .env in the ./docker directory if .env does not exist. This is usually used for initial setup.
* `make dev` : Starts all configured Docker services in development mode. It first checks the .env file for completeness against .env.example.
* `make start` : Similar to dev, but explicitly builds the Docker images before starting the services. This target also checks the .env file for required variables.
* `make stop` : Stops all running Docker services defined in the compose files.
* `make destroy` : Stops all services and removes all volumes associated with the Docker compose setup, ensuring a clean state.
* `make check-env` : Checks if the ./docker/.env file exists and contains all the necessary environment variables as defined in ./docker/.env.example. If the file does not exist, it is created from the example. It also lists missing variables if any.

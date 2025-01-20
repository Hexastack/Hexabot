---
icon: laptop-arrow-down
---

# Installation

## Prerequisites

To ensure Hexabot runs smoothly, you'll need the following:

* **Docker:** We recommend using Docker to start the app since multiple services are required (MongoDB, Nginx, etc.). All the necessary Docker Compose files are located in the **docker** folder.

{% content-ref url="../developer-guide/setting-up-docker-for-development-and-production.md" %}
[setting-up-docker-for-development-and-production.md](../developer-guide/setting-up-docker-for-development-and-production.md)
{% endcontent-ref %}

* **Node.js:** For development purposes, ensure you have Node.js >= v18.17.0 installed. We recommend using nvm (Node Version Manager) to easily manage and update your Node.js versions.&#x20;

{% content-ref url="../developer-guide/setup-node.js-with-nvm.md" %}
[setup-node.js-with-nvm.md](../developer-guide/setup-node.js-with-nvm.md)
{% endcontent-ref %}

<details>

<summary>Do you want to install Hexabot on a Windows machine?</summary>

1. Download and install Docker Desktop for Windows.
2. During installation, ensure that you select the option to use WSL 2 as the default backend for Docker.
3. After installation, start Docker Desktop and verify that WSL integration is enabled:
4. Open Docker Desktop and go to Settings. Under the General tab, ensure that "Use the WSL 2 based engine" is selected. Under Resources > WSL Integration, enable integration with your installed Linux distribution (e.g., Ubuntu). Restart your machine to finalize the Docker installation.
5. Open your WSL terminal (e.g., Ubuntu).
6. Follow Hexabot [installation ](installation.md#installation)steps below

Learn more : [https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers)

</details>

### Installation

1. **Install Hexabot CLI globally to have easy access to its commands:**

```
npm install -g hexabot-cli
```

2. **Create a new project**:

```
hexabot create my-chatbot
```

3. **Navigate to your project folder**

```
cd my-chatbot/
```

4. **Install dependencies**:

```
npm i
```

5. **Environment Setup:**&#x20;

To configure the environment variables, use the following command:

```
hexabot init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

6. **Run in development mode:** Once your environment is set up, you can start the app. Use the following command:

```
hexabot dev --services ollama
```

Notice that we added an extra service called [Ollama](https://ollama.com/). Ollama makes it easy to get up and running with large language models locally. Make sure to SSH into the container and pull the model(s) you would like to use:

```
docker exec -it ollama ollama pull tinyllama
```

You can pull different models, a complete reference of all the Ollama models can be found here: [https://ollama.com/library](https://ollama.com/library).

{% hint style="info" %}
**Note:** The first time you run the app, Docker will take some time to download all the required images
{% endhint %}

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

{% hint style="info" %}
You can find more about the Hexabot CLI command [here](../developer-guide/cli-command-reference.md).
{% endhint %}
---
icon: rectangle-terminal
---

# CLI Command Reference

Hexabot CLI is a powerful command-line tool to help manage your Hexabot chatbot instance. With it, you can create new projects, initialize environments, start services in various modes, run database migrations, and more. The CLI aims to make managing your chatbot seamless and intuitive.

Not yet familiar with [Hexabot](https://hexabot.ai/)? It's a open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

### Getting Started

#### Prerequisites

* Node.js >= 18.17.0
* npm (Node Package Manager)
* Docker installed

#### Installation

Install Hexabot CLI globally to have easy access to its commands:

```
npm install -g hexabot-cli
```

#### Usage

Once installed, you can use the `hexabot` command in your terminal. Here are some of the available commands:

#### Commands

**`create <projectName>`**

Create a new Hexabot project.

```
hexabot create my-chatbot
```

Options:

* `--template <template>`: Specify a GitHub repository in the format `GITHUB_USERNAME/GITHUB_REPO` to use a custom template.

Example:

```
hexabot create my-chatbot --template myusername/my-template-repo
```

**`init`**

Initialize the environment by copying `.env.example` to `.env`.

```
hexabot init
```

**`dev`**

Start specified services in development mode with Docker Compose.

```
hexabot dev --services nlu,ollama
```

Options:

* `--services <services>`: Comma-separated list of services to enable.

**`start`**

Start specified services with Docker Compose.

```
hexabot start --services api,nlu
```

Options:

* `--services <services>`: Comma-separated list of services to enable.

**`migrate [args...]`**

Run database migrations.

```
hexabot migrate
```

You can also pass additional arguments to the migration command.

**`start-prod`**



Start specified services in production mode with Docker Compose.

```
hexabot start-prod --services api,nlu
```

Options:

* `--services <services>`: Comma-separated list of services to enable.

**`stop`**

Stop specified Docker Compose services.

```
hexabot stop --services api,nlu
```

Options:

* `--services <services>`: Comma-separated list of services to stop.

**`destroy`**

Destroy specified Docker Compose services and remove volumes.

```
hexabot destroy --services api,nlu
```

Options:

* `--services <services>`: Comma-separated list of services to destroy.

### Example Workflow

1.  **Create a new project**:

    ```
    hexabot create my-chatbot
    ```

    This will create a new folder `my-chatbot` with all necessary files to get started.
2.  **Navigate to your project folder**:

    ```
    cd my-chatbot
    ```
3.  **Install dependencies**:

    ```
    npm install
    ```
4.  **Initialize environment**:

    ```
    hexabot init
    ```

    This command copies the `.env.example` file to `.env`, which you can edit to customize your configuration.
5.  **Run in development mode**:

    ```
    hexabot dev --services nlu,ollama
    ```

    This starts the required services in development mode.

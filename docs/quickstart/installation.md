---
description: Install Hexabot locally, create a project, and run it with the CLI.
icon: laptop-arrow-down
---

# Installation

Get a local Hexabot project running in a few minutes.

### Prerequisites

You need:

* Node.js `^20.19.0`
* One package manager: `npm`, `pnpm`, `yarn`, or `bun`
* Docker if you want to run Docker-based services

If you manage Node.js with `nvm`, see [Setup Node.js with NVM](../developer-guide/setup-node.js-with-nvm.md).

If you use Docker for development, see [Setting Up Docker for Development and Production](../developer-guide/setting-up-docker.md).

{% hint style="info" %}
`hexabot create` prompts for your initial admin credentials. Run it from an interactive terminal.
{% endhint %}

### Install the CLI

Install the CLI globally:

```bash
npm install -g @hexabot-ai/cli
```

Or run it without a global install:

```bash
npx @hexabot-ai/cli --help
```

### Create and run a project

```bash
hexabot create my-project
cd my-project
hexabot dev
```

If you prefer `npx`, use:

```bash
npx @hexabot-ai/cli create my-project
cd my-project
npx @hexabot-ai/cli dev
```

Hexabot detects your package manager automatically. To force one, use `--pm`:

```bash
hexabot create my-project --pm npm
```

### Local endpoints

After the app starts, these endpoints are available by default:

* Admin UI: `http://localhost:8080`
* API: `http://localhost:3000/api`
* API docs: `http://localhost:3000/docs`

Use the admin credentials you created during project setup.

### Useful commands

* `hexabot create <project-name>`
* `hexabot dev [--docker --services <list>]`
* `hexabot start [--docker --services <list>]`
* `hexabot docker <up|down|logs|ps|start>`
* `hexabot env <init|list>`
* `hexabot check`
* `hexabot config <show|set>`
* `hexabot migrate [args...]`

### Notes

* SQLite is the default local database.
* Postgres is recommended for production.
* If you work on the Hexabot monorepo, use PNPM and follow the [Contributors Installation Guide](/broken/spaces/12ok30OlFEEb6WoWfH8l/pages/GiKubNuo8tQcnF25GthU).

For the full command list, see [CLI Command Reference](../developer-guide/cli-command-reference.md).

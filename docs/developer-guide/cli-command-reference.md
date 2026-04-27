---
description: Install, run, and manage Hexabot projects with the official CLI.
icon: rectangle-terminal
---

# CLI Command Reference

Use the Hexabot CLI to create projects, bootstrap env files, run local development, manage Docker services, and inspect project config.

Hexabot CLI is published as `@hexabot-ai/cli`.

If you are new to local setup, start with [Installation](../quickstart/installation.md).

### Prerequisites

You need:

* Node.js `>= 20.19.0`
* One package manager: `npm`, `pnpm`, `yarn`, or `bun`
* Docker Desktop or Docker Engine if you use `--docker` or `hexabot docker ...`

### Install the CLI

Install the CLI globally:

```bash
npm install -g @hexabot-ai/cli
```

Or run it with `npx`:

```bash
npx @hexabot-ai/cli --help
```

### Usage

The default flow is:

```bash
hexabot create my-project
cd my-project
hexabot dev
```

Docker is optional. Use it only when you need extra services like Postgres or Redis.

{% hint style="info" %}
Local development uses SQLite by default. Add `--docker` when you want Docker Compose.
{% endhint %}

### Commands

#### `create <project-name>`

Scaffold a new Hexabot project from the official NestJS starter template.

```bash
hexabot create support-bot
```

Common options:

* `-t, --template <name>` — template repository. Use `org/repo` or shorthand `starter`.
* `--pm <npm|pnpm|yarn|bun>` — force a package manager.
* `--no-install` — skip dependency installation.
* `--dev` — run `hexabot dev` when scaffolding finishes.
* `--docker` — bootstrap Docker env files.
* `--force` — scaffold into a non-empty directory.

The command downloads the latest template release, installs dependencies unless skipped, and bootstraps `.env`. It also prepares `.env.docker` when you pass `--docker`.

#### `dev`

Run the current project in development mode.

Local mode runs the configured package script. By default, that is `npm run dev`.

```bash
# Local development
hexabot dev

# Docker development with Postgres
hexabot dev --docker --services postgres
```

Options:

* `--docker` — run Docker Compose instead of the local package script.
* `--services <list>` — comma-separated Compose overlays or profiles.
* `-d, --detach` — detach Docker Compose.
* `--env <file>` — use a custom env file in local mode. Default is `.env`.
* `--no-env-bootstrap` — skip automatic env file copying.
* `--pm <npm|pnpm|yarn|bun>` — temporarily override the package manager.

#### `env`

Manage `.env` files for local and Docker workflows.

* `hexabot env init` — copy `.env.example` to `.env`
* `hexabot env init --docker` — copy `.env.docker.example` to `.env.docker`
* `hexabot env list` — show which env files exist or are missing

Use `--force` with `env init` to overwrite an existing file.

#### `docker`

Use Docker Compose helpers from the project's `docker/` folder.

* `hexabot docker up [--services <list>] [--build] [-d]`
* `hexabot docker down [--services <list>] [--volumes]`
* `hexabot docker logs [service] [-f | --since <1h>]`
* `hexabot docker ps`
* `hexabot docker start [--services <list>] [--build] [-d]`

The CLI combines `docker-compose.yml` with matching service overlays like `docker-compose.<service>.yml`. It can also copy `.env.docker.example` on first run.

For Docker setup details, see [Setting Up Docker for Development and Production](setting-up-docker-for-development-and-production.md).

#### `start`

Run the project in a production-oriented mode.

```bash
hexabot start
hexabot start --docker --services api,postgres --build
```

Behavior:

* Local mode runs the configured `start` script. By default, that is `npm run start`.
* Docker mode uses production overlays like `docker-compose.<service>.prod.yml`.
* Pass `--env-bootstrap` if you want env files copied automatically.

#### `check`

Run diagnostics for the current environment.

```bash
hexabot check
hexabot check --docker-only
```

The output includes PASS or FAIL checks for Node.js version, project detection, env files, and optional Docker availability.

#### `config`

Inspect or update `hexabot.config.json`.

* `hexabot config show`
* `hexabot config set <key> <value>`

`config set` supports dot notation:

```bash
hexabot config set docker.defaultServices "postgres,redis"
```

#### `migrate [args...]`

Run database migrations inside the Docker `api` container.

Any extra arguments are forwarded to `npm run migrate`.

```bash
hexabot migrate
```

### Example Workflow

1.  **Create a project.**

    ```bash
    npx @hexabot-ai/cli create support-bot
    ```
2.  **Enter the project and start local development.**

    ```bash
    cd support-bot
    hexabot dev
    ```
3.  **Opt into Docker when you need infrastructure services.**

    ```bash
    hexabot dev --docker --services postgres,redis
    ```

    Or manage Docker services directly:

    ```bash
    hexabot docker up --services postgres
    ```

That is the happy path: `create → cd → dev`.

### Related pages

* [Installation](../quickstart/installation.md)
* [Contributors Installation Guide](contributors-installation-guide.md)
*   [Setting Up Docker for Development and Production](setting-up-docker-for-development-and-production.md)

    This starts the required services in development mode.

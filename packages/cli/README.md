# Hexabot CLI

Hexabot CLI is a powerful command-line tool to help manage your Hexabot project instance. With it, you can create new projects, initialize environments, start services in various modes, run database migrations, and more. The CLI aims to make managing your chatbot seamless and intuitive.


Not yet familiar with [Hexabot](https://hexabot.ai/)? It's a open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

## Getting Started

### Prerequisites

- Node.js >= 20.18.1
- One package manager (`npm`, `pnpm`, `yarn`, or `bun`)
- Docker Desktop/Engine (only required when you pass `--docker` or use `hexabot docker ...`)

### Installation

Install Hexabot CLI globally to have easy access to its commands:

```sh
npm install -g @hexabot-ai/cli
```

### Usage

Once installed, you can use the `hexabot` command anywhere. The CLI focuses on a “zero to bot” flow: create a project, `cd` into it, and run `hexabot dev`. Docker is optional and available via `--docker` or the `hexabot docker ...` helpers.

### Commands

#### `create <project-name>`

Scaffold a new Hexabot project from the official NestJS starter template.

```sh
hexabot create support-bot
```

Common options:

- `-t, --template <name>` – template repository. Use `org/repo` or shorthand `starter`.
- `--pm <npm|pnpm|yarn|bun>` – force a package manager (auto-detected otherwise).
- `--no-install` – skip running the package manager after scaffolding.
- `--dev` – immediately run `hexabot dev` once creation is complete.
- `--docker` – bootstrap the Docker env file and hint about Docker-first commands.
- `--force` – allow scaffolding into a non-empty directory.

The command downloads the latest template release, installs dependencies (unless `--no-install`), and bootstraps `.env` (and `.env.docker` when `--docker` is passed).

#### `dev`

Run the current project in development mode. Defaults to local (SQLite) development by running the configured package script (defaults to `npm run dev`).

```sh
# Local dev
hexabot dev

# Docker dev with Postgres profile
hexabot dev --docker --services postgres
```

Options:

- `--docker` – run Docker Compose instead of the package script.
- `--services <list>` – comma-separated Compose overlays/profiles to enable.
- `-d, --detach` – detach Docker Compose.
- `--env <file>` – custom env file for local dev (defaults to `.env`).
- `--no-env-bootstrap` – skip copying `.env.example` files automatically.
- `--pm <npm|pnpm|yarn|bun>` – temporarily override the package manager.

#### `env`

Helper commands to manage `.env` files.

- `hexabot env init` – copy `.env.example` ➜ `.env`.
- `hexabot env init --docker` – copy `.env.docker.example` ➜ `.env.docker`.
- `hexabot env list` – show which env files exist or are missing.

Flags: `--force` overwrites existing files when running `env init`.

#### `docker`

Quality-of-life wrappers around `docker compose` using the project’s `docker/` folder.

- `hexabot docker up [--services <list>] [--build] [-d]`
- `hexabot docker down [--services <list>] [--volumes]`
- `hexabot docker logs [service] [-f | --since <1h>]`
- `hexabot docker ps`
- `hexabot docker start [--services <list>] [--build] [-d]` – convenience alias for `hexabot start --docker`

The CLI automatically stitches together `docker-compose.yml` + `docker-compose.<service>.yml` overlays and can copy `.env.docker.example` on first run.

#### `start`

Production-oriented variant of `dev`.

```sh
hexabot start
hexabot start --docker --services api,postgres --build
```

- Local mode runs the configured `start` script (defaults to `npm run start`).
- Docker mode uses the “prod” compose overlays (e.g. `docker-compose.<service>.prod.yml`) so no dev-specific files are chained.
- Pass `--env-bootstrap` if you still want the CLI to copy env examples automatically.

#### `check`

Run diagnostics for the current environment.

```sh
hexabot check
hexabot check --docker-only
```

Outputs PASS/FAIL entries for Node.js version, project detection, env files, and optionally Docker.

#### `config`

Inspect or tweak `hexabot.config.json` without editing it manually.

- `hexabot config show`
- `hexabot config set <key> <value>` (supports dot notation, e.g. `docker.defaultServices "postgres,redis"`)

#### `migrate [args...]`

Run database migrations inside the Docker `api` container. Any extra args are forwarded to `npm run migrate`.

## Example Workflow

1. **Create a new project** (installs dependencies automatically unless `--no-install`):

   ```sh
   npx @hexabot-ai/cli create support-bot
   ```

2. **Enter the project and start local dev (SQLite, no Docker required)**:

   ```sh
   cd support-bot
   hexabot dev
   ```

3. **Need infrastructure like Postgres or Redis? Opt in with Docker**:

   ```sh
   hexabot dev --docker --services postgres,redis
   # or manage Docker services directly
   hexabot docker up --services postgres
   ```

That’s it—`create → cd → dev` is the happy path, while Docker and env helpers remain available on demand.

## Documentation

For detailed information on how to get started, as well as in-depth user and developer guides, please refer to our full documentation available in the docs folder or visit the [Documentation](https://docs.hexabot.ai).

You can also find specific documentation for different components of the project in the following locations:

- [API Documentation](api/README.md)
- [UI Documentation](frontend/README.md)
- [Live Chat Widget Documentation](widget/README.md)
- [NLU Engine Documentation](nlu/README.md)

## Contributing

We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Please refer to our contribution policy first : [How to contribute to Hexabot](./CONTRIBUTING.md)


[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License

Copyright (c) 2025 Hexastack.

This project is licensed under the **Fair Core License, Version 1.0**, with **Apache License 2.0** as the future license (abbrev. **FCL-1.0-ALv2**).

**Change date.** For each version of the software, the Fair Core License converts to Apache-2.0 on the **second anniversary** of the date that version is made available.

**Commercial features & license keys.** Certain features of Hexabot are protected by license-key checks. You **must not** remove, modify, disable, or circumvent those checks, nor enable access to protected functionality without a valid license key.

**Competing uses (non-compete).** Use that competes with Hexastack’s business—for example, offering Hexabot (or a substantially similar service) as a hosted or commercial product—is not permitted until the conversion to Apache-2.0 for the applicable version.

**Redistribution.** If you distribute copies, modifications, or derivatives, you must include this license and not remove copyright or proprietary notices.

**Patents.** A limited patent license is granted for permitted uses and terminates on patent aggression.

**Trademarks.** “Hexabot” and “Hexastack” are trademarks. Except to identify Hexastack as the origin of the software, no trademark rights are granted.

**Disclaimer.** The software is provided “AS IS,” without warranties or conditions of any kind, and Hexastack will not be liable for any damages arising from its use.

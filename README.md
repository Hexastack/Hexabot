<p align="center">
  <a href="https://hexabot.ai" target="_blank">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/Ov50Pwe.png" />
      <img alt="Hexabot logo" src="https://i.imgur.com/gz1FnM7.png" width="280" />
    </picture>
  </a>
</p>

<div align="center">
  <h2>Automate the Boring, Keep the Magic</h2>
  <p>Build and run agentic workflows across channels with YAML, tools, MCP, memory and RAG.</p>
</div>

<p align="center">
  <a href="https://hexabot.ai"><strong>Website</strong></a>
  ·
  <a href="https://docs.hexabot.ai"><strong>Documentation</strong></a>
  ·
  <a href="https://hexabot.ai/extensions"><strong>Extensions</strong></a>
  ·
  <a href="https://discord.gg/rNb9t2MFkG"><strong>Discord</strong></a>
</p>

Hexabot v3 is an automation platform with first-class AI capabilities, combining workflows, actions, and conversational channels in one runtime.

## Quick Start

### Prerequisites

- Node.js `^20.19.0`
- One package manager (`npm`, `pnpm`, `yarn`, or `bun`)
- Docker (optional, for Docker-based services)

This Quick Start targets projects generated with the CLI.  
If you are contributing to the Hexabot monorepo itself, use **PNPM** (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

### 1) Install the CLI

```bash
npm install -g @hexabot-ai/cli
```

Or run the CLI without a global install:

```bash
npx @hexabot-ai/cli --help
```

### 2) Create and run a project

```bash
hexabot create my-project
cd my-project
hexabot dev
```

No global install? Use `npx` equivalents:

```bash
npx @hexabot-ai/cli create my-project
cd my-project
npx @hexabot-ai/cli dev
```

`hexabot create` auto-detects your package manager. You can force one with `--pm`, for example:

```bash
hexabot create my-project --pm npm
```

`hexabot create` prompts for initial admin credentials and requires an interactive terminal (TTY). In CI/non-interactive shells, run it from a local terminal first.

Default local endpoints:

- Admin UI: `http://localhost:3000`
- API: `http://localhost:3000/api`
- API docs (non-production): `http://localhost:3000/docs`

Useful CLI commands:

- `hexabot create <project-name>`
- `hexabot dev [--docker --services <list>]`
- `hexabot start [--docker --services <list>]`
- `hexabot docker <up|down|logs|ps|start>`
- `hexabot env <init|list>`
- `hexabot check`
- `hexabot config <show|set>`
- `hexabot migrate [args...]`

For full CLI details, see [packages/cli/README.md](packages/cli/README.md).

## Core Capabilities

- **Agentic workflows:** YAML workflow definitions with typed runtime contracts.
- **Action-based execution:** actions define workflow behavior with schema-validated inputs/outputs/settings.
- **Binding system:** reusable capability/config bindings separated from task logic.
- **Memory support:** explicit memory definitions and runtime memory integration.
- **MCP integration points:** Model Context Protocol support for tool/context interoperability.
- **Multi-channel continuity:** channels and helpers remain core concepts.
- **Schema-first architecture:** broad use of Zod for validation and shared contracts.

## Data Layer

- **TypeORM** is the standard backend data layer.
- **SQLite** is the default local option.
- **Postgres** is first-class for production setups.
- Configure DB runtime using `DB_TYPE` and `DB_*` variables.

## Contributing

If you want to contribute to the Hexabot monorepo (architecture, package map, PNPM workspace, Turbo tasks, CI checks), use [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Copyright (c) 2025 Hexastack.

Licensed under **FCL-1.0-ALv2**. See [LICENSE.md](./LICENSE.md) for full terms.

## ❓ FAQ

### General

**What is Hexabot v3?**
Hexabot v3 is an automation platform with first-class AI capabilities, combining YAML-driven workflows, actions, conversational channels, MCP integration, and memory/RAG in a single runtime.

**How is v3 different from earlier versions?**
v3 introduces a schema-first architecture with Zod validation, a binding system that separates capability/config from task logic, and agentic workflows with typed runtime contracts — a significant evolution from v2's channel-bot architecture.

### Setup & Configuration

**What are the system requirements?**
- Node.js `^20.19.0`
- A package manager (`npm`, `pnpm`, `yarn`, or `bun`)
- Docker (optional, for Docker-based services)

**Which databases are supported?**
- **SQLite** — default for local development
- **Postgres** — first-class for production setups
Configure with `DB_TYPE` and related `DB_*` environment variables.

**How do I run Hexabot with Docker?**
Use the CLI's Docker integration:
```bash
hexabot dev --docker          # Dev mode with Docker services
hexabot docker up             # Start Docker services
hexabot docker logs           # View service logs
```

### Usage

**How do I define agentic workflows?**
Workflows are defined in YAML with typed contracts. Actions define behavior with schema-validated inputs/outputs/settings, and bindings provide reusable capabilities separated from task logic.

**What is the MCP integration?**
Hexabot supports Model Context Protocol (MCP) for tool and context interoperability, allowing agents to connect with external tools and services through a standardized protocol.

**How does memory work?**
Hexabot supports explicit memory definitions and runtime memory integration, enabling agents to maintain context across conversations and workflow executions.

### Troubleshooting

**`hexabot create` fails in CI/non-interactive shells**
The CLI requires an interactive terminal (TTY) for initial admin credential setup. Run it from a local terminal first, then use non-interactive commands in CI.

**Admin UI or API not accessible**
Default endpoints are:
- Admin UI: `http://localhost:3000`
- API: `http://localhost:3000/api`
- API docs: `http://localhost:3000/docs`
Check that no other service is using port 3000 and that Docker services are running if using `--docker`.

**Database connection errors**
Verify your `DB_TYPE` and `DB_*` environment variables are correctly set. For Postgres, ensure the database server is running and accessible. Use `hexabot check` to validate your configuration.

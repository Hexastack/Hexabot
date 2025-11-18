# Hexabot CLI

This document distills the current behavior of the Hexabot CLI and acts as a quick reference for extending or coordinating the CLI subcommands that orchestrate Hexabot projects.

## Runtime & Bootstrap

- **Entry point**: `src/index.ts` renders the figlet banner (`printBanner()`, `src/ui/banner.ts`), runs `checkPrerequisites()` before any command registration, and is compiled to `dist/index.js`, which the `package.json` `bin.hexabot` field exposes as the `hexabot` binary.
- **CLI factory**: `createCliProgram()` (`src/cli.ts`) instantiates the Commander program, sets the name/description, loads the version via `getCliVersion()` (`src/utils/version.ts`, falls back to `3.0.0` if package.json cannot be read), and wires in the `create`, `init`, compose, and `migrate` registrars.
- **Prerequisite gate**: `checkPrerequisites()` (`src/core/prerequisites.ts`) runs `docker --version` and ensures Node.js ≥ 20.18.1 using `compareVersions()`. Any failure prints actionable instructions and exits before `program.parse()` executes.
- **Working folder guard**: `ensureDockerFolder()` (`src/core/project.ts`) resolves `<cwd>/docker` and aborts with guidance if that folder is missing. Commands that touch env files or containers (`init`, compose lifecycles, `migrate`) call it up front so they only run inside a Hexabot project tree.

All Docker Compose lifecycle commands (`start`, `dev`, `start-prod`, `stop`, `destroy`) share the `--services` option. Commander feeds it as a string (default `''`), which `parseServices()` (`src/utils/services.ts`) turns into the sanitized array that downstream helpers expect.

## Subcommand Catalog

| Command | Responsibilities | Options & IO | Implementation Notes |
| --- | --- | --- | --- |
| `create <projectName>` | Scaffold a new Hexabot project from the latest release of a template repo, emit onboarding hints. | `--template` overrides the default `hexastack/hexabot-template-starter`. Downloads the release ZIP via GitHub's API and extracts it into `<projectName>/`. | Implemented in `src/commands/create.ts`. Validates the slug via `validateProjectName()` (`src/utils/validation.ts`), ensures `<projectName>/` exists, fetches the latest tag from `https://api.github.com/repos/<repo>/releases/latest`, builds `https://github.com/<repo>/archive/refs/tags/<tag>.zip`, and streams it to `downloadAndExtractTemplate()` (`src/services/templates.ts`) which saves `template.zip`, decompresses with `strip: 1`, and deletes the archive. Successful runs print the bright "next steps" checklist. |
| `init` | Duplicate `docker/.env.example` to `docker/.env` without overwriting an existing file. | No options. | `src/commands/init.ts` resolves the docker folder, checks for `docker/.env`, and copies `docker/.env.example` when needed; otherwise it logs a warning and exits cleanly. |
| `start` | Compose and boot the requested services in the default stack. | `--services nlu,ollama` layers service-specific `docker-compose.<service>.yml` files; omitting the flag uses only `docker-compose.yml`. | Defined via `composeCommandDefinitions` in `src/commands/compose.ts` with lifecycle `up`. `runComposeCommand()` ensures the docker folder exists, feeds the sanitized services list into `generateComposeFiles()` (`src/core/docker.ts`) to build the ordered `-f` flags (base file + per-service overlays), then calls `dockerCompose("<flags> up -d")` to launch. |
| `dev` | Same as `start`, but includes dev overlays and forces image rebuilds. | `--services` identical to `start`. | The compose definition sets `mode: 'dev'` and lifecycle `up-build`, so each service adds `docker-compose.<service>.dev.yml` if it exists, and the stack ends with `docker-compose.dev.yml`. The generated command becomes `docker compose <flags> up --build -d`. |
| `migrate [args…]` | Proxy database migrations through the `api` container. | Optional trailing args get appended to `npm run migrate`. | `src/commands/migrate.ts` ensures the docker folder is present, joins the args into a single string, and executes `dockerExec('api', 'npm run migrate …', '--user $(id -u):$(id -g)')` so files written inside the container stay owned by the host user. |
| `start-prod` | Launch production overlays. | Same options as `start`. | The compose definition uses `mode: 'prod'`, so `generateComposeFiles()` appends `docker-compose.<service>.prod.yml` per service (when present) and `docker-compose.prod.yml` before running `docker compose … up -d`. |
| `stop` | Stop active services via `docker compose down`. | `--services` optionally narrows the compose file set. | Lifecycle `down` with no mode still runs the shared compose-file resolution logic so partial stacks can be torn down cleanly. |
| `destroy` | Tear down services and remove volumes. | `--services` optional. | Lifecycle `down-volumes` adds the `-v` flag so `docker compose` removes any attached volumes after shutting down the services resolved by the given compose files. |

## Shared Utilities

- **`ensureDockerFolder()` / `resolveDockerFolder()`** (`src/core/project.ts`) centralize the docker path resolution and the friendly "please cd into your project" failure mode.
- **`checkPrerequisites()`** (`src/core/prerequisites.ts`) is the only place that shells out to verify Docker and Node.js availability before Commander parses user input.
- **`generateComposeFiles(folder, services, mode?)`** (`src/core/docker.ts`) returns a space-delimited string of `-f` arguments starting with `docker-compose.yml`, followed by each `docker-compose.<service>.yml`, and then optional service-level and global dev/prod overlays when they exist on disk.
- **`dockerCompose(args)`** and **`dockerExec(container, command, options?)`** (`src/core/docker.ts`) print the resolved commands with chalk highlighting, run them synchronously via `execSync`, and exit with code `1` and a terse error message when Docker fails.
- **`parseServices(list)`** (`src/utils/services.ts`) trims whitespace, splits on commas, and strips empty tokens so CLI layers can safely pass empty defaults.
- **`downloadAndExtractTemplate(url, destination)`** (`src/services/templates.ts`) grabs the release archive with Axios, writes it to `<destination>/template.zip`, extracts it with `decompress` using `strip: 1`, and deletes the temporary ZIP. Errors propagate back to the `create` command so it can log them.
- **`validateProjectName(name)`** (`src/utils/validation.ts`) enforces lowercase names that start with a letter while still allowing digits and single dashes.
- **`getCliVersion(readFile?)`** (`src/utils/version.ts`) loads `packages/cli/package.json` to derive the version Commander displays; if the read fails it falls back to `3.0.0` after logging the error.

## Typical Workflow

1. `hexabot create my-bot` — bootstrap a project from the default template. The command enforces the naming convention, fetches the latest GitHub release, and unpacks it into `./my-bot/`.
2. `cd my-bot && hexabot init` — copy environment defaults (`docker/.env.example → docker/.env`) before editing.
3. `hexabot dev --services nlu,ollama` — compose the base stack, service overrides, any `*.dev.yml` overlays, and `docker-compose.dev.yml`, then run `docker compose … up --build -d`.
4. `hexabot migrate` — run migrations inside the `api` container as the host user.
5. `hexabot stop|destroy --services api` — stop or fully remove the targeted services and volumes via the shared compose resolver.

## Extending the CLI

- **Adding a new subcommand**: Follow the existing pattern by creating `register<Feature>Command(program: Command)` modules under `src/commands/` and wiring them into `createCliProgram()` (`src/cli.ts`). That keeps help text, versioning, and registration centralized.
- **Compose lifecycle tweaks**: Extend or modify `composeCommandDefinitions` in `src/commands/compose.ts` to add new lifecycle verbs (`up`, `up-build`, `down`, `down-volumes`) or new modes (`dev`, `prod`). The shared handler automatically inherits the `--services` option, docker-folder guard, and compose-file layering.
- **Service-aware commands**: Always call `ensureDockerFolder()` before touching `docker/`, reuse `parseServices()`/`generateComposeFiles()` to respect the existing compose structure, and run shell operations through `dockerCompose()`/`dockerExec()` so logging and exit semantics stay consistent.
- **Safety checks**: Keep the `printBanner()` + `checkPrerequisites()` flow at the top of `src/index.ts`, and update this file whenever a command or helper is added, removed, or materially changed so downstream automation can rely on up-to-date behavior.
